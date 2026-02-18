import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ VERIFICAR AUTH
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ CRIAR CLIENT AUTENTICADO
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // ✅ OBTER USER AUTENTICADO (MÉTODO CORRETO)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // ✅ PARSE REQUEST BODY
    const { to, subject, html, templateId, campaignId, cadenceEnrollmentId, metadata } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ VERIFICAR RESEND API KEY
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ ENVIAR VIA RESEND
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Pede Direto <geral@pededireto.pt>",
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: resendData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ✅ USAR SERVICE ROLE PARA ESCREVER NA DB (BYPASS RLS)
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ✅ LOG DO EMAIL
    const { error: logError } = await adminClient.from("email_logs").insert({
      campaign_id: campaignId || null,
      template_id: templateId || null,
      recipient_email: to,
      recipient_type: metadata?.recipient_type || "business",
      recipient_id: metadata?.business_id || null,
      subject,
      html_content: html,
      sent_by: userId,
      provider: "resend",
      provider_id: resendData.id,
      provider_status: "sent",
      metadata: metadata || {},
    });

    if (logError) {
      console.error("Log error:", logError);
      // Não falhar o request por causa do log
    }

    // ✅ CRIAR NOTIFICAÇÃO
    const { error: notifError } = await adminClient.from("email_notifications").insert({
      user_id: userId,
      type: "email_sent",
      title: `Email enviado para ${to}`,
      message: `Assunto: ${subject}`,
    });

    if (notifError) {
      console.error("Notification error:", notifError);
      // Não falhar o request por causa da notificação
    }

    // ✅ RETORNAR SUCESSO
    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
