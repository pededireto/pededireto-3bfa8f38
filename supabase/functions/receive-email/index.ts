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
    const {
      from_email,
      from_name,
      subject,
      body_text,
      body_html,
      provider_message_id,
      in_reply_to,
    } = body;

    if (!from_email || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing from_email or subject" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to find the business by email
    const { data: business } = await adminClient
      .from("businesses")
      .select("id")
      .eq("email", from_email)
      .maybeSingle();

    // Check if it's a reply to a sent email
    let inReplyToLogId: string | null = null;
    if (in_reply_to) {
      const { data: origLog } = await adminClient
        .from("email_logs")
        .select("id, sent_by")
        .eq("provider_id", in_reply_to)
        .maybeSingle();

      if (origLog) {
        inReplyToLogId = origLog.id;

        // Update original log with replied_at
        await adminClient
          .from("email_logs")
          .update({ replied_at: new Date().toISOString() })
          .eq("id", origLog.id);

        // Notify sender
        if (origLog.sent_by) {
          await adminClient.from("email_notifications").insert({
            user_id: origLog.sent_by,
            type: "email_replied",
            email_log_id: origLog.id,
            title: `Resposta recebida de ${from_name || from_email}`,
            message: subject,
          });
        }

        // Pause cadence if applicable
        const { data: logWithMeta } = await adminClient
          .from("email_logs")
          .select("metadata")
          .eq("id", origLog.id)
          .single();

        if (logWithMeta?.metadata?.cadence_enrollment_id) {
          const { data: enrollment } = await adminClient
            .from("email_cadence_enrollments")
            .select("pause_on_reply")
            .eq("id", logWithMeta.metadata.cadence_enrollment_id)
            .single();

          if (enrollment?.pause_on_reply) {
            await adminClient
              .from("email_cadence_enrollments")
              .update({ status: "paused" })
              .eq("id", logWithMeta.metadata.cadence_enrollment_id);
          }
        }
      }
    }

    // Insert into inbox
    const { error: inboxError } = await adminClient
      .from("email_inbox")
      .insert({
        from_email,
        from_name: from_name || null,
        subject,
        body_text: body_text || null,
        body_html: body_html || null,
        business_id: business?.id || null,
        provider_message_id: provider_message_id || null,
        status: "new",
      });

    if (inboxError) {
      console.error("Inbox insert error:", inboxError);
      throw inboxError;
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Receive email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
