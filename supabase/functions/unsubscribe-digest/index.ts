import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id");
  const token = url.searchParams.get("token");

  if (!businessId || !token) {
    return new Response(htmlPage("Erro", "Link inválido. Verifique o link no email."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Verify token
  const UNSUBSCRIBE_SECRET = Deno.env.get("CRON_SECRET") || "pededireto-unsub";
  const expectedToken = generateToken(businessId, UNSUBSCRIBE_SECRET);

  if (token !== expectedToken) {
    return new Response(htmlPage("Erro", "Token inválido. Verifique o link no email."), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert preference
    const { error } = await adminClient
      .from("business_email_preferences")
      .upsert({
        business_id: businessId,
        weekly_digest: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });

    if (error) {
      console.error("Unsubscribe error:", error);
      return new Response(htmlPage("Erro", "Ocorreu um erro. Tente novamente mais tarde."), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(htmlPage(
      "Subscrição cancelada",
      "Removido com sucesso do resumo semanal.<br/>Pode alterar as preferências de email a qualquer momento no seu dashboard."
    ), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new Response(htmlPage("Erro", "Ocorreu um erro interno."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

function generateToken(businessId: string, secret: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(businessId + secret);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  return Math.abs(hash).toString(36);
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Pede Direto</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0d0d0d; color: #e5e7eb; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1a1a1a; border-radius: 12px; padding: 40px; max-width: 460px; text-align: center; }
    h1 { color: #4caf50; font-size: 24px; margin: 0 0 16px; }
    p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin: 0 0 24px; }
    a { color: #4caf50; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://pededireto.lovable.app">← Voltar ao Pede Direto</a>
  </div>
</body>
</html>`;
}
