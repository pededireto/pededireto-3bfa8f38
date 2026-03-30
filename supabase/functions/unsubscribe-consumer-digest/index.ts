import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return new Response("<h1>Parâmetros inválidos</h1>", {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient
      .from("consumer_email_preferences")
      .upsert(
        { user_id: userId, weekly_digest: false, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:Arial,sans-serif;background:#0d0d0d;color:#e5e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;padding:40px;">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h1 style="color:#4caf50;font-size:22px;">Subscrição cancelada</h1>
          <p style="color:#9ca3af;margin-top:12px;">Não receberá mais o resumo semanal do Pede Direto.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px;">Pode reativar a qualquer momento no seu painel.</p>
          <a href="https://pededireto.lovable.app/dashboard"
             style="display:inline-block;margin-top:20px;background:#4caf50;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            Ir para o Painel
          </a>
        </div>
      </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response("<h1>Erro ao processar</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
