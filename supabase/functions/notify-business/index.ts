// supabase/functions/notify-business/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWhatsApp(text: string) {
  const phone = Deno.env.get("CALLMEBOT_PHONE");
  const apikey = Deno.env.get("CALLMEBOT_APIKEY");

  if (!phone || !apikey) {
    console.warn("CallMeBot credentials not configured, skipping WhatsApp");
    return;
  }

  const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`;
  const res = await fetch(waUrl);
  if (!res.ok) console.error("CallMeBot error:", await res.text());
  else console.log("WhatsApp sent");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json();
    const { type, business_id, request_id, ticket_id, title, priority, category } = body;

    // ── NOVO TICKET ───────────────────────────────────────────────────────
    if (type === "novo_ticket") {
      const priorityEmoji =
        priority === "urgent" ? "🚨" : priority === "high" ? "🔴" : priority === "medium" ? "🟡" : "🟢";

      await sendWhatsApp(
        `${priorityEmoji} PEDE DIRETO — Novo Ticket\n` +
          `📋 ${title || "Sem título"}\n` +
          `🏷️ ${category || "Geral"} · ${priority || "medium"}\n` +
          `👉 pededireto.pt/admin/tickets`,
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── NOVO MATCH / NOVA MENSAGEM ────────────────────────────────────────
    const { data: business, error: bizError } = await adminClient
      .from("businesses")
      .select(`id, name, owner_id, business_users (user_id)`)
      .eq("id", business_id)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", bizError);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerUserId = business.owner_id || (business.business_users as any[])?.[0]?.user_id;

    let requestDescription = "Novo pedido recebido";
    let requestCity = "";
    let categoryName = "";

    if (request_id) {
      const { data: sr } = await adminClient
        .from("service_requests")
        .select("description, location_city, categories(name)")
        .eq("id", request_id)
        .single();

      if (sr) {
        requestDescription = sr.description || requestDescription;
        requestCity = sr.location_city || "";
        categoryName = (sr.categories as any)?.name || "";
      }
    }

    const notifTitle =
      type === "novo_match"
        ? "🆕 Novo pedido recebido!"
        : type === "nova_mensagem"
          ? "💬 Nova mensagem!"
          : "🔔 Nova notificação";

    const shortDesc = requestDescription?.slice(0, 100) + (requestDescription?.length > 100 ? "…" : "");

    const notifMessage =
      type === "novo_match"
        ? `${categoryName ? `[${categoryName}] ` : ""}${shortDesc}${requestCity ? ` · ${requestCity}` : ""}`
        : type === "nova_mensagem"
          ? "Tens uma nova mensagem num pedido."
          : "Verifica o teu painel.";

    // Notificação interna
    if (business_id) {
      await adminClient.from("business_notifications").insert({
        business_id,
        type: type === "novo_match" ? "request" : "system",
        title: notifTitle.replace(/[\u{1F300}-\u{1FFFF}]/gu, "").trim(),
        message: notifMessage,
        is_read: false,
      });
    }

    // WhatsApp — só para novo_match
    if (type === "novo_match") {
      await sendWhatsApp(
        `🚨 PEDE DIRETO\n` +
          `Novo pedido para: *${business.name}*\n` +
          `📋 ${shortDesc}\n` +
          `${requestCity ? `📍 ${requestCity}\n` : ""}` +
          `👉 pededireto.pt/business-dashboard`,
      );
    }

    // Email — só novo_match com dono
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (ownerUserId && RESEND_API_KEY && type === "novo_match") {
      const { data: ownerData } = await adminClient.auth.admin.getUserById(ownerUserId);
      const ownerEmail = ownerData?.user?.email;

      if (ownerEmail) {
        const emailHtml = `
          <!DOCTYPE html>
          <html lang="pt">
          <head><meta charset="UTF-8"></head>
          <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <div style="background:#16a34a;padding:24px 32px;">
                <h1 style="color:white;margin:0;font-size:22px;">Pede Direto</h1>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#111;margin-top:0;">Novo pedido recebido!</h2>
                <p style="color:#444;font-size:16px;">O teu negócio <strong>${business.name}</strong> recebeu um novo pedido.</p>
                <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;margin:24px 0;">
                  <p style="margin:0;color:#166534;font-size:14px;"><strong>Pedido:</strong> ${shortDesc}</p>
                  ${requestCity ? `<p style="margin:8px 0 0;color:#166534;font-size:14px;"><strong>Localização:</strong> ${requestCity}</p>` : ""}
                </div>
                <a href="https://pededireto.pt/business-dashboard"
                   style="display:inline-block;background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  Ver no Painel →
                </a>
              </div>
              <div style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
                <p style="color:#999;font-size:12px;margin:0;">Pede Direto · <a href="https://pededireto.pt" style="color:#16a34a;">pededireto.pt</a></p>
              </div>
            </div>
          </body>
          </html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pede Direto <geral@pededireto.pt>",
            to: [ownerEmail],
            subject: `Novo pedido recebido — ${business.name}`,
            html: emailHtml,
          }),
        });

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
