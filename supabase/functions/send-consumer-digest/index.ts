import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConsumerDigest {
  user_id: string;
  full_name: string;
  email: string;
  requests_count: number;
  responses_count: number;
  reviews_count: number;
  favorites_count: number;
  new_badges: { name: string; icon: string }[];
  top_categories: string[];
  prev_requests: number;
  prev_responses: number;
}

function renderDelta(current: number, previous: number): string {
  const diff = current - previous;
  if (diff > 0) return `<span style="color:#16a34a;font-size:12px;">↑ +${diff}</span>`;
  if (diff < 0) return `<span style="color:#ef4444;font-size:12px;">↓ ${diff}</span>`;
  return `<span style="color:#9ca3af;font-size:12px;">= igual</span>`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function getTip(d: ConsumerDigest): string {
  if (d.requests_count === 0) return "💡 Crie o seu primeiro pedido de serviço e receba propostas de profissionais verificados.";
  if (d.responses_count === 0 && d.requests_count > 0) return "💡 Ainda sem respostas? Tente detalhar melhor o que precisa no seu pedido.";
  if (d.reviews_count === 0) return "💡 Avalie os profissionais que contactou — ajuda outros utilizadores a escolher!";
  if (d.favorites_count < 3) return "💡 Guarde os negócios que mais gosta nos favoritos para os encontrar rapidamente.";
  return "💡 Continue a explorar a plataforma — há sempre algo novo para descobrir!";
}

function buildConsumerDigestHtml(d: ConsumerDigest, unsubscribeUrl: string): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const firstName = d.full_name?.split(/\s+/)[0] || "Utilizador";

  let badgesHtml = "";
  if (d.new_badges.length > 0) {
    badgesHtml = `
      <div style="margin:16px 0;">
        <div style="color:#e5e7eb;font-size:14px;font-weight:600;margin-bottom:8px;">🏅 Conquistas desta semana</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${d.new_badges.map(b => `
            <div style="background:#1a1a1a;border-radius:8px;padding:10px 16px;text-align:center;">
              <span style="font-size:20px;">${b.icon}</span>
              <div style="color:#4caf50;font-weight:600;font-size:13px;margin-top:2px;">${b.name}</div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  let categoriesHtml = "";
  if (d.top_categories.length > 0) {
    categoriesHtml = `
      <div style="margin:16px 0;">
        <div style="color:#e5e7eb;font-size:14px;font-weight:600;margin-bottom:8px;">🔍 Categorias mais exploradas</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${d.top_categories.slice(0, 5).map(c => `
            <span style="background:#1a2e1a;color:#a3d9a5;border-radius:20px;padding:4px 14px;font-size:13px;">${c}</span>
          `).join("")}
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;margin:0;padding:0;">
  <div style="background:#0d0d0d;padding:40px 20px;">
    <div style="max-width:560px;margin:0 auto;">
      
      <div style="text-align:center;margin-bottom:24px;">
        <div style="color:#4caf50;font-size:28px;font-weight:700;">📬 O seu resumo semanal</div>
        <div style="color:#9ca3af;font-size:13px;margin-top:4px;">Semana de ${formatDate(weekAgo)} a ${formatDate(now)}</div>
      </div>

      <p style="color:#e5e7eb;font-size:15px;line-height:1.6;">
        Olá <strong style="color:#ffffff;">${firstName}</strong>! Aqui está o resumo da sua atividade no <strong style="color:#4caf50;">Pede Direto</strong> esta semana:
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">📋</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.requests_count}</div>
          <div style="color:#9ca3af;font-size:12px;">Pedidos criados</div>
          <div style="margin-top:4px;">${renderDelta(d.requests_count, d.prev_requests)}</div>
        </div>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">💬</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.responses_count}</div>
          <div style="color:#9ca3af;font-size:12px;">Respostas recebidas</div>
          <div style="margin-top:4px;">${renderDelta(d.responses_count, d.prev_responses)}</div>
        </div>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">⭐</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.reviews_count}</div>
          <div style="color:#9ca3af;font-size:12px;">Avaliações feitas</div>
        </div>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">❤️</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.favorites_count}</div>
          <div style="color:#9ca3af;font-size:12px;">Favoritos</div>
        </div>
      </div>

      ${badgesHtml}
      ${categoriesHtml}

      <div style="background:#1a2e1a;border-left:3px solid #4caf50;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;">
        <p style="color:#a3d9a5;font-size:14px;margin:0;">${getTip(d)}</p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://pededireto.lovable.app/dashboard"
           style="background:#4caf50;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Ver o meu painel →
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #333;margin:28px 0;" />
      <p style="color:#6b7280;font-size:11px;text-align:center;line-height:1.6;">
        Recebe este email porque tem conta no Pede Direto.<br/>
        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Cancelar subscrição do resumo semanal</a>
      </p>
      <p style="color:#4b5563;font-size:11px;text-align:center;">
        © ${new Date().getFullYear()} Pede Direto · Portugal
      </p>
    </div>
  </div>
</body>
</html>`;
}

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
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BASE_URL = Deno.env.get("SUPABASE_URL")!;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();
    const twoWeeksAgoISO = twoWeeksAgo.toISOString();

    // Get all profiles with emails (consumers = users without business_users owner role)
    const { data: allProfiles } = await adminClient
      .from("profiles")
      .select("id, user_id, full_name, email")
      .not("email", "is", null);

    if (!allProfiles || allProfiles.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "No profiles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out users who opted out
    const { data: optOuts } = await adminClient
      .from("consumer_email_preferences")
      .select("user_id")
      .eq("weekly_digest", false);

    const optOutSet = new Set((optOuts || []).map(o => o.user_id));

    const eligible = allProfiles.filter(p => p.email && !optOutSet.has(p.user_id));

    console.log(`Consumer digest: ${eligible.length} eligible users`);

    let sent = 0;
    let errors = 0;

    for (const profile of eligible) {
      try {
        // Requests this week
        const { count: requestsCount } = await adminClient
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .gte("created_at", weekAgoISO);

        // Requests prev week
        const { count: prevRequests } = await adminClient
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .gte("created_at", twoWeeksAgoISO)
          .lt("created_at", weekAgoISO);

        // Get request IDs for this week to count responses
        const { data: thisWeekRequests } = await adminClient
          .from("service_requests")
          .select("id")
          .eq("user_id", profile.user_id)
          .gte("created_at", weekAgoISO);

        const reqIds = (thisWeekRequests || []).map(r => r.id);

        let responsesCount = 0;
        let prevResponses = 0;

        if (reqIds.length > 0) {
          const { count } = await adminClient
            .from("service_request_matches")
            .select("id", { count: "exact", head: true })
            .in("request_id", reqIds)
            .gte("created_at", weekAgoISO);
          responsesCount = count || 0;
        }

        // Previous week responses
        const { data: prevWeekRequests } = await adminClient
          .from("service_requests")
          .select("id")
          .eq("user_id", profile.user_id)
          .gte("created_at", twoWeeksAgoISO)
          .lt("created_at", weekAgoISO);

        const prevReqIds = (prevWeekRequests || []).map(r => r.id);
        if (prevReqIds.length > 0) {
          const { count } = await adminClient
            .from("service_request_matches")
            .select("id", { count: "exact", head: true })
            .in("request_id", prevReqIds)
            .gte("created_at", twoWeeksAgoISO)
            .lt("created_at", weekAgoISO);
          prevResponses = count || 0;
        }

        // Reviews this week
        const { count: reviewsCount } = await adminClient
          .from("business_reviews")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .gte("created_at", weekAgoISO);

        // Favorites total
        const { count: favoritesCount } = await adminClient
          .from("user_favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id);

        // Consumer badges earned this week
        const { data: badgesData } = await adminClient
          .from("consumer_earned_badges")
          .select("consumer_badges(name, icon)")
          .eq("user_id", profile.user_id)
          .gte("earned_at", weekAgoISO);

        const new_badges = (badgesData || []).map((b: any) => ({
          name: b.consumer_badges?.name || "Badge",
          icon: b.consumer_badges?.icon || "🏅",
        }));

        // Top categories from activity log
        const { data: activityData } = await adminClient
          .from("consumer_activity_log")
          .select("metadata")
          .eq("user_id", profile.user_id)
          .eq("event_type", "search")
          .gte("created_at", weekAgoISO)
          .limit(20);

        const categoryCounts: Record<string, number> = {};
        for (const a of activityData || []) {
          const cat = (a.metadata as any)?.category;
          if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
        const top_categories = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name);

        // Skip users with zero activity
        const totalActivity = (requestsCount || 0) + (responsesCount || 0) + (reviewsCount || 0) + new_badges.length;
        if (totalActivity === 0 && (favoritesCount || 0) === 0) continue;

        const digest: ConsumerDigest = {
          user_id: profile.user_id,
          full_name: profile.full_name || "Utilizador",
          email: profile.email!,
          requests_count: requestsCount || 0,
          responses_count: responsesCount,
          reviews_count: reviewsCount || 0,
          favorites_count: favoritesCount || 0,
          new_badges,
          top_categories,
          prev_requests: prevRequests || 0,
          prev_responses: prevResponses,
        };

        const unsubscribeUrl = `${BASE_URL}/functions/v1/unsubscribe-consumer-digest?user_id=${profile.user_id}`;
        const html = buildConsumerDigestHtml(digest, unsubscribeUrl);
        const subject = `📬 O seu resumo semanal — Pede Direto`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pede Direto <geral@pededireto.pt>",
            to: [profile.email],
            subject,
            html,
            headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
          }),
        });

        if (!resendRes.ok) {
          const err = await resendRes.json();
          console.error(`Failed to send to ${profile.email}:`, err);
          errors++;
          continue;
        }

        const resendData = await resendRes.json();

        // Log
        await adminClient.from("email_logs").insert({
          recipient_email: profile.email,
          recipient_type: "consumer",
          subject,
          html_content: html,
          provider: "resend",
          provider_id: resendData.id,
          provider_status: "sent",
          metadata: { type: "consumer_weekly_digest", user_id: profile.user_id },
        });

        sent++;
      } catch (err) {
        console.error(`Error processing ${profile.email}:`, err);
        errors++;
      }
    }

    console.log(`Consumer digest complete: ${sent} sent, ${errors} errors`);

    return new Response(JSON.stringify({ ok: true, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Consumer digest error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
