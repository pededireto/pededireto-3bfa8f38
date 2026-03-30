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
    const { business_id } = await req.json();
    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get business details
    const { data: business, error: bizErr } = await adminClient
      .from("businesses")
      .select("id, name, city, owner_id")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner profile
    const { data: owner } = await adminClient
      .from("business_users")
      .select("user_id")
      .eq("business_id", business_id)
      .eq("role", "owner")
      .limit(1)
      .single();

    if (!owner?.user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_owner" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from profiles
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", owner.user_id)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ ok: true, skipped: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerName = profile.full_name || "Responsável";
    const businessName = business.name || "o seu negócio";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #16a34a; font-size: 28px; margin: 0;">✅ O seu negócio está activo!</h1>
    </div>
    
    <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
      Olá <strong>${ownerName}</strong>,
    </p>
    
    <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
      O seu negócio <strong>${businessName}</strong> foi verificado e está agora visível 
      para milhares de consumidores em Portugal!
    </p>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="font-size: 14px; color: #166534; margin: 0 0 12px 0; font-weight: 600;">
        Para aparecer mais acima nos resultados, complete o seu perfil:
      </p>
      <ul style="font-size: 14px; color: #166534; margin: 0; padding-left: 20px; line-height: 2;">
        <li>Adicione logo (+20 pts)</li>
        <li>Escreva uma descrição (+20 pts)</li>
        <li>Adicione WhatsApp (+15 pts)</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://pededireto.lovable.app/negocio/dashboard" 
         style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
        Completar perfil agora →
      </a>
    </div>

    <p style="font-size: 16px; color: #1f2937; line-height: 1.6;">
      Bem-vindo à Pede Direto! 🎉
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Pede Direto — A plataforma que liga consumidores a negócios locais em Portugal.
    </p>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Pede Direto <noreply@pededireto.pt>",
        to: [profile.email],
        subject: "✅ O seu negócio está activo na Pede Direto!",
        html: emailHtml,
      }),
    });

    const result = await res.json();
    console.log("Resend response:", result);

    return new Response(JSON.stringify({ ok: true, resend: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
