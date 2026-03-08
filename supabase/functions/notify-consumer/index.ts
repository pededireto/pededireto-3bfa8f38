import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map event types to preference keys
const EVENT_PREF_MAP: Record<string, string> = {
  match_accepted: "email_on_response",
  new_message: "email_on_message",
  badge_earned: "email_on_badge",
};

// Default preferences if none exist yet
const DEFAULT_PREFS = {
  email_on_response: true,
  email_on_message: true,
  email_on_badge: false,
  email_weekly_summary: false,
  email_marketing: false,
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
    const { type, request_id, business_id } = body;

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: "request_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request details
    const { data: sr } = await adminClient
      .from("service_requests")
      .select("user_id, description, location_city, subcategory_id, categories(name), subcategories(name)")
      .eq("id", request_id)
      .single();

    if (!sr) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile id from auth user id (preferences FK → profiles.id)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", sr.user_id)
      .single();

    // ── Check consumer notification preferences ──
    let preferences = { ...DEFAULT_PREFS };

    if (profile?.id) {
      const { data: prefs } = await adminClient
        .from("consumer_notification_preferences")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (prefs) {
        preferences = {
          email_on_response: prefs.email_on_response ?? DEFAULT_PREFS.email_on_response,
          email_on_message: prefs.email_on_message ?? DEFAULT_PREFS.email_on_message,
          email_on_badge: prefs.email_on_badge ?? DEFAULT_PREFS.email_on_badge,
          email_weekly_summary: prefs.email_weekly_summary ?? DEFAULT_PREFS.email_weekly_summary,
          email_marketing: prefs.email_marketing ?? DEFAULT_PREFS.email_marketing,
        };
      } else {
        // Auto-create default preferences row for this consumer
        await adminClient
          .from("consumer_notification_preferences")
          .insert({ user_id: profile.id });
        console.log("Created default preferences for profile:", profile.id);
      }
    }

    // Check if user wants email for this event type
    const prefKey = EVENT_PREF_MAP[type];
    if (prefKey && preferences[prefKey as keyof typeof preferences] === false) {
      console.log(`Email skipped: user disabled ${prefKey} (event: ${type})`);
      return new Response(
        JSON.stringify({ success: true, email: false, reason: "preference_disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business name
    let businessName = "Um profissional";
    if (business_id) {
      const { data: biz } = await adminClient
        .from("businesses")
        .select("name")
        .eq("id", business_id)
        .single();
      if (biz) businessName = biz.name;
    }

    // Get consumer email
    const { data: userData } = await adminClient.auth.admin.getUserById(sr.user_id);
    const consumerEmail = userData?.user?.email;

    if (!consumerEmail) {
      console.warn("Consumer email not found for user:", sr.user_id);
      return new Response(
        JSON.stringify({ success: true, email: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, email: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subcatName = (sr.subcategories as any)?.name || (sr.categories as any)?.name || "serviço";
    const city = sr.location_city || "";
    const requestUrl = `https://pededireto.pt/pedido/${request_id}`;
    const shortDesc = (sr.description || "").slice(0, 100) + ((sr.description || "").length > 100 ? "…" : "");

    const subject =
      type === "match_accepted"
        ? `${businessName} aceitou o seu pedido!`
        : `Nova mensagem de ${businessName}`;

    const actionText =
      type === "match_accepted"
        ? "aceitou o seu pedido"
        : "enviou-lhe uma mensagem";

    const emailHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#16a34a;padding:24px 32px;">
      <h1 style="color:white;margin:0;font-size:22px;">Pede Direto</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#111;margin-top:0;">Tem uma resposta ao seu pedido!</h2>
      <p style="color:#444;font-size:16px;">
        <strong>${businessName}</strong> ${actionText} de
        <strong>${subcatName}</strong>${city ? ` em <strong>${city}</strong>` : ""}.
      </p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;margin:24px 0;">
        <p style="margin:0;color:#166534;font-size:14px;"><strong>Pedido:</strong> ${shortDesc}</p>
      </div>
      <a href="${requestUrl}"
         style="display:inline-block;background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Ver Resposta →
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">
        Pede Direto · <a href="https://pededireto.pt" style="color:#16a34a;">pededireto.pt</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pede Direto <geral@pededireto.pt>",
        to: [consumerEmail],
        subject,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      console.error("Resend error:", await emailRes.text());
    } else {
      console.log("Consumer email sent to:", consumerEmail);
    }

    return new Response(
      JSON.stringify({ success: true, email: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-consumer error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
