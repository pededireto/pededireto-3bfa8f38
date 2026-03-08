import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const providerId = data.email_id;
    if (!providerId) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: corsHeaders,
      });
    }

    // Find matching log
    const { data: logEntry } = await adminClient
      .from("email_logs")
      .select("id, sent_by, metadata")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (!logEntry) {
      console.log("No matching log for provider_id:", providerId);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: corsHeaders,
      });
    }

    const updates: Record<string, unknown> = {};

    switch (type) {
      case "email.delivered":
        updates.provider_status = "delivered";
        break;
      case "email.opened":
        updates.opened_at = new Date().toISOString();
        updates.provider_status = "opened";
        break;
      case "email.clicked":
        updates.clicked_at = new Date().toISOString();
        updates.provider_status = "clicked";
        break;
      case "email.bounced":
        updates.bounced = true;
        updates.bounce_reason = data.bounce?.message || "Unknown bounce";
        updates.provider_status = "bounced";
        break;
      default:
        updates.provider_status = type.replace("email.", "");
    }

    await adminClient
      .from("email_logs")
      .update(updates)
      .eq("id", logEntry.id);

    // ── PAUSE ENROLLMENT ON REPLY ──
    if (type === "email.replied" || type === "email.reply") {
      const metadata = logEntry.metadata as Record<string, any> | null;
      const enrollmentId = metadata?.cadence_enrollment_id;

      if (enrollmentId) {
        await adminClient
          .from("email_cadence_enrollments")
          .update({
            status: "paused",
            paused_at: new Date().toISOString(),
            paused_reason: "Respondeu ao email",
          })
          .eq("id", enrollmentId)
          .eq("status", "active");

        console.log("Paused enrollment due to reply:", enrollmentId);
      }
    }

    // Notify sender
    if (logEntry.sent_by) {
      const notifType =
        type === "email.bounced"
          ? "email_bounced"
          : type === "email.opened"
          ? "email_opened"
          : type === "email.clicked"
          ? "email_clicked"
          : type === "email.replied" || type === "email.reply"
          ? "email_replied"
          : "email_event";

      await adminClient.from("email_notifications").insert({
        user_id: logEntry.sent_by,
        type: notifType,
        email_log_id: logEntry.id,
        title:
          type === "email.bounced"
            ? "Email devolvido"
            : type === "email.opened"
            ? "Email aberto"
            : type === "email.clicked"
            ? "Link clicado"
            : type === "email.replied" || type === "email.reply"
            ? "Email respondido"
            : `Evento: ${type}`,
        message: `Provider ID: ${providerId}`,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
