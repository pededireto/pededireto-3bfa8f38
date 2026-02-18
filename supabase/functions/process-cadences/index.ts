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
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get all active enrollments
    const { data: enrollments, error: enrollError } = await adminClient
      .from("email_cadence_enrollments")
      .select("*, email_cadences!inner(is_active)")
      .eq("status", "active")
      .eq("email_cadences.is_active", true);

    if (enrollError) {
      throw enrollError;
    }

    let processed = 0;
    let sent = 0;

    for (const enrollment of enrollments || []) {
      processed++;

      // Check if reply received and pause_on_reply
      if (enrollment.pause_on_reply) {
        const { data: replied } = await adminClient
          .from("email_logs")
          .select("id")
          .eq("recipient_email", enrollment.recipient_email)
          .not("replied_at", "is", null)
          .limit(1);

        if (replied && replied.length > 0) {
          await adminClient
            .from("email_cadence_enrollments")
            .update({ status: "paused" })
            .eq("id", enrollment.id);
          continue;
        }
      }

      // Get current step
      const { data: steps } = await adminClient
        .from("email_cadence_steps")
        .select("*, email_templates(*)")
        .eq("cadence_id", enrollment.cadence_id)
        .order("step_order", { ascending: true });

      if (!steps || steps.length === 0) continue;

      const currentStepIndex = enrollment.current_step || 0;
      const step = steps[currentStepIndex];

      if (!step) {
        // All steps completed
        await adminClient
          .from("email_cadence_enrollments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);
        continue;
      }

      // Check delay
      const enrolledAt = new Date(enrollment.enrolled_at);
      const delayMs =
        (step.delay_days * 24 * 60 + (step.delay_hours || 0) * 60) * 60 * 1000;

      // For subsequent steps, calculate from enrollment + cumulative delays
      let cumulativeDelay = 0;
      for (let i = 0; i <= currentStepIndex; i++) {
        cumulativeDelay +=
          (steps[i].delay_days * 24 * 60 + (steps[i].delay_hours || 0) * 60) *
          60 *
          1000;
      }

      const sendAt = new Date(enrolledAt.getTime() + cumulativeDelay);
      if (new Date() < sendAt) continue;

      // Check idempotency - don't send same step twice
      const { data: existing } = await adminClient
        .from("email_logs")
        .select("id")
        .eq("recipient_email", enrollment.recipient_email)
        .eq("template_id", step.template_id)
        .eq("metadata->>cadence_enrollment_id", enrollment.id)
        .limit(1);

      if (existing && existing.length > 0) {
        // Already sent, advance step
        await adminClient
          .from("email_cadence_enrollments")
          .update({ current_step: currentStepIndex + 1 })
          .eq("id", enrollment.id);
        continue;
      }

      const template = step.email_templates;
      if (!template) continue;

      // Send email
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pede Direto <noreply@pededireto.pt>",
          to: [enrollment.recipient_email],
          subject: template.subject,
          html: template.html_content,
        }),
      });

      const resendData = await resendRes.json();

      if (resendRes.ok) {
        sent++;

        await adminClient.from("email_logs").insert({
          template_id: step.template_id,
          recipient_email: enrollment.recipient_email,
          recipient_id: enrollment.business_id,
          subject: template.subject,
          html_content: template.html_content,
          sent_by: enrollment.enrolled_by,
          provider: "resend",
          provider_id: resendData.id,
          provider_status: "sent",
          metadata: {
            cadence_id: enrollment.cadence_id,
            cadence_enrollment_id: enrollment.id,
            step_order: step.step_order,
          },
        });

        // Advance step
        const nextStep = currentStepIndex + 1;
        if (nextStep >= steps.length) {
          await adminClient
            .from("email_cadence_enrollments")
            .update({
              current_step: nextStep,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);
        } else {
          await adminClient
            .from("email_cadence_enrollments")
            .update({ current_step: nextStep })
            .eq("id", enrollment.id);
        }
      } else {
        console.error("Cadence email send failed:", resendData);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process cadences error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
