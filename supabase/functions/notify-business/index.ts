// supabase/functions/notify-business/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { type, business_id, request_id, match_id } = body;

    // ── Buscar dados do negócio e dono ────────────────────────────────────
    const { data: business, error: bizError } = await adminClient
      .from("businesses")
      .select(`
        id, name, owner_id,
        business_users (user_id)
      `)
      .eq("id", business_id)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", bizError);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determinar user_id do dono (owner_id ou business_users)
    const ownerUserId =
      business.owner_id ||
      (business.business_users as any[])?.[0]?.user_id;

    if (!ownerUserId) {
      console.log("No owner for business:", business_id);
      return new Response(JSON.stringify({ skipped: "No owner" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Buscar email do dono ──────────────────────────────────────────────
    const { data: ownerData } = await adminClient.auth.admin.getUserById(ownerUserId);
    const ownerEmail = ownerData?.user?.email;

    // ── Buscar dados do pedido ────────────────────────────────────────────
    let requestDescription = "Novo pedido recebido";
    let requestCity = "";

    if (request_id) {
      const { data: sr } = await adminClient
        .from("service_requests")
        .select("description, location_city, categories(name)")
        .eq("id", request_id)
        .single();

      if (sr) {
        requestDescription = sr.description || requestDescription;
        requestCity = sr.location_city || "";
      }
    }

    // ── Criar notificação interna ─────────────────────────────────────────
    const notifTitle =
      type === "novo_match" ? "Novo pedido recebido!" :
      type === "nova_mensagem" ? "Nova mensagem!" :
      "Nova notificação";

    const notifMessage =
      type === "novo_match"
        ? `Recebeste um novo pedido${requestCity ? ` de ${requestCity}` : ""}: "${requestDescription?.slice(0, 80)}${requestDescription?.length > 80 ? "…" : ""}"`
        : type === "nova_mensagem"
        ? `Tens uma nova mensagem num pedido.`
        : "Verifica o teu painel.";

    await adminClient.from("business_notifications").insert({
      business_id,
      type: type === "novo_match" ? "request" : "system",
      title: notifTitle,
      message: notifMessage,
      is_read: false,
    });

    // ── Enviar email se tiver endereço ────────────────────────────────────
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (ownerEmail && RESEND_API_KEY) {
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #16a34a; padding: 24px 32px;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Pede Direto</h1>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <h2 style="color: #111; margin-top: 0;">${notifTitle}</h2>
              <p style="color: #444; font-size: 16px; line-height: 1.6;">${notifMessage}</p>

              ${type === "novo_match" ? `
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 24px 0;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  <strong>Pedido:</strong> ${requestDescription?.slice(0, 150)}${requestDescription?.length > 150 ? "…" : ""}
                </p>
                ${requestCity ? `<p style="margin: 8px 0 0; color: #166534; font-size: 14px;"><strong>Localização:</strong> ${requestCity}</p>` : ""}
              </div>
              ` : ""}

              <a href="https://pededireto.pt/business-dashboard" 
                 style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
                Ver no Painel →
              </a>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Pede Direto · <a href="https://pededireto.pt" style="color: #16a34a;">pededireto.pt</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pede Direto <geral@pededireto.pt>",
          to: [ownerEmail],
          subject: notifTitle,
          html: emailHtml,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.json();
        console.error("Resend error:", err);
      } else {
        console.log("Email sent to:", ownerEmail);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("notify-business error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
