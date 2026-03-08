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
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

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
    let skipped = 0;

    for (const enrollment of enrollments || []) {
      processed++;

      // Check pause_on_reply
      if (enrollment.pause_on_reply) {
        const { data: replied } = await adminClient
          .from("email_logs")
          .select("id")
          .eq("recipient_email", enrollment.recipient_email)
          .not("replied_at", "is", null)
          .limit(1);

        if (replied && replied.length > 0) {
          await adminClient.from("email_cadence_enrollments").update({
            status: "paused",
            paused_at: new Date().toISOString(),
            paused_reason: "Respondeu ao email",
          }).eq("id", enrollment.id);
          continue;
        }
      }

      // Check pause_on_click
      if (enrollment.pause_on_click) {
        const { data: clicked } = await adminClient
          .from("email_logs")
          .select("id")
          .eq("recipient_email", enrollment.recipient_email)
          .not("clicked_at", "is", null)
          .eq("metadata->>cadence_id", enrollment.cadence_id)
          .limit(1);

        if (clicked && clicked.length > 0) {
          await adminClient.from("email_cadence_enrollments").update({
            status: "paused",
            paused_at: new Date().toISOString(),
            paused_reason: "Clicou num link",
          }).eq("id", enrollment.id);
          continue;
        }
      }

      const { data: steps } = await adminClient
        .from("email_cadence_steps")
        .select("*, email_templates(*)")
        .eq("cadence_id", enrollment.cadence_id)
        .order("step_order", { ascending: true });

      if (!steps || steps.length === 0) continue;

      const currentStepIndex = enrollment.current_step || 0;
      const step = steps[currentStepIndex];

      if (!step) {
        await adminClient
          .from("email_cadence_enrollments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);
        continue;
      }

      // Check delay timing
      const enrolledAt = new Date(enrollment.enrolled_at);
      let cumulativeDelay = 0;
      for (let i = 0; i <= currentStepIndex; i++) {
        cumulativeDelay += (steps[i].delay_days * 24 * 60 + (steps[i].delay_hours || 0) * 60) * 60 * 1000;
      }
      const sendAt = new Date(enrolledAt.getTime() + cumulativeDelay);
      if (new Date() < sendAt) continue;

      // ── CONDITION CHECK ──
      const conditionType = step.condition_type || "always";
      const conditionRefStep = step.condition_ref_step;

      if (conditionType !== "always" && conditionRefStep != null) {
        // Find the referenced step (by step_order)
        const refStep = steps.find((s: any) => s.step_order === conditionRefStep);

        if (refStep) {
          // Look for the email_log of the referenced step for this enrollment
          const { data: refLogs } = await adminClient
            .from("email_logs")
            .select("id, opened_at, clicked_at")
            .eq("recipient_email", enrollment.recipient_email)
            .eq("template_id", refStep.template_id)
            .eq("metadata->>cadence_id", enrollment.cadence_id)
            .eq("metadata->>step_order", String(refStep.step_order))
            .limit(1);

          const refLog = refLogs?.[0];
          let conditionMet = false;

          switch (conditionType) {
            case "if_opened":
              conditionMet = !!refLog?.opened_at;
              break;
            case "if_not_opened":
              conditionMet = !refLog?.opened_at;
              break;
            case "if_clicked":
              conditionMet = !!refLog?.clicked_at;
              break;
            case "if_not_clicked":
              conditionMet = !refLog?.clicked_at;
              break;
            default:
              conditionMet = true;
          }

          if (!conditionMet) {
            // Skip this step and advance
            skipped++;
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
            continue;
          }
        }
      }

      // Check if already sent
      const { data: existing } = await adminClient
        .from("email_logs")
        .select("id")
        .eq("recipient_email", enrollment.recipient_email)
        .eq("template_id", step.template_id)
        .eq("metadata->>cadence_enrollment_id", enrollment.id)
        .limit(1);

      if (existing && existing.length > 0) {
        await adminClient
          .from("email_cadence_enrollments")
          .update({ current_step: currentStepIndex + 1 })
          .eq("id", enrollment.id);
        continue;
      }

      const template = step.email_templates;
      if (!template) continue;

      // Send via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pede Direto <geral@pededireto.pt>",
          reply_to: "geral@pededireto.pt",
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

    return new Response(JSON.stringify({ ok: true, processed, sent, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process cadences error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
