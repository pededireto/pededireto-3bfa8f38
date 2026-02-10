import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate CRON_SECRET to prevent unauthorized invocation
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!resendApiKey) {
      console.error("[send-expiry-alerts] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get expiration logs from last 24h that haven't been contacted
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: logs, error: logsError } = await supabase
      .from("expiration_logs")
      .select("*, businesses(name, cta_whatsapp, cta_phone, cta_email)")
      .eq("contact_status", "nao_contactado")
      .gte("deactivated_at", yesterday.toISOString());

    if (logsError) {
      console.error("[send-expiry-alerts] Error fetching logs:", logsError);
      throw logsError;
    }

    if (!logs || logs.length === 0) {
      console.log("[send-expiry-alerts] No new expirations to report");
      return new Response(
        JSON.stringify({ message: "No new expirations", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Build email HTML
    const businessRows = logs.map((log: any) => {
      const biz = log.businesses;
      const whatsappLink = biz?.cta_whatsapp
        ? `https://wa.me/${biz.cta_whatsapp.replace(/\D/g, "")}`
        : "#";
      return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px;">
          <strong>🏪 ${biz?.name || "Negócio"}</strong><br/>
          <span style="color: #6b7280; font-size: 13px;">Plano: ${log.plan_name} (${log.plan_price}€)</span><br/>
          <span style="color: #6b7280; font-size: 13px;">Expirou em: ${log.expired_at}</span>
        </td>
        <td style="padding: 12px; font-size: 13px;">
          ${biz?.cta_phone || "—"}<br/>
          ${biz?.cta_email || "—"}
        </td>
        <td style="padding: 12px;">
          <a href="${whatsappLink}" style="background: #25D366; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px;">WhatsApp</a>
        </td>
      </tr>`;
    }).join("");

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 18px;">⚠️ Negócios Expirados — Ação Comercial Necessária</h1>
      </div>
      <div style="padding: 20px; background: #ffffff; border: 1px solid #e5e7eb;">
        <p>Olá equipa comercial,</p>
        <p>Os seguintes negócios ficaram inativos por expiração de plano:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Negócio</th>
              <th style="padding: 10px; text-align: left;">Contacto</th>
              <th style="padding: 10px; text-align: left;">Ação</th>
            </tr>
          </thead>
          <tbody>${businessRows}</tbody>
        </table>
        <p><strong>Total de negócios a contactar: ${logs.length}</strong></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;"/>
        <p style="color: #6b7280; font-size: 13px;">PedeDireto | Área de Gestão</p>
      </div>
    </div>`;

    const emailResponse = await resend.emails.send({
      from: "PedeDireto <noreply@pededireto.pt>",
      to: ["geral.pededireto@gmail.com"],
      subject: `⚠️ [PedeDireto] ${logs.length} Negócio(s) Expirado(s) — Ação Comercial Necessária`,
      html,
    });

    console.log("[send-expiry-alerts] Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Email sent", count: logs.length, emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[send-expiry-alerts] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
