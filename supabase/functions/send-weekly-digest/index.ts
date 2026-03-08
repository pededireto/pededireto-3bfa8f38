import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BusinessDigest {
  business_id: string;
  business_name: string;
  plan_id: string | null;
  subcategory_id: string | null;
  owner_name: string;
  owner_email: string;
  views_this_week: number;
  views_prev_week: number;
  contacts_this_week: number;
  contacts_prev_week: number;
  position_now: number | null;
  position_prev: number | null;
  new_reviews: number;
  new_requests: number;
  badges_earned: { name: string; icon_url: string | null }[];
  ranking_score: number;
  has_whatsapp: boolean;
  has_description: boolean;
  has_schedule: boolean;
}

function renderDelta(current: number, previous: number | null): string {
  if (previous === null) return `<span style="color:#9ca3af;font-size:12px;">Sem dados anteriores</span>`;
  const diff = current - previous;
  if (diff > 0) return `<span style="color:#16a34a;font-size:12px;">↑ +${diff} vs semana anterior</span>`;
  if (diff < 0) return `<span style="color:#ef4444;font-size:12px;">↓ ${diff} vs semana anterior</span>`;
  return `<span style="color:#9ca3af;font-size:12px;">= Sem alteração</span>`;
}

function renderPositionDelta(now: number | null, prev: number | null): string {
  if (now === null) return "";
  if (prev === null) return `<span style="color:#9ca3af;font-size:12px;">Sem dados anteriores</span>`;
  const diff = prev - now; // lower position = better
  if (diff > 0) return `<span style="color:#16a34a;font-size:12px;">↑ Subiu ${diff} posição${diff > 1 ? "ões" : ""}</span>`;
  if (diff < 0) return `<span style="color:#ef4444;font-size:12px;">↓ Desceu ${Math.abs(diff)} posição${Math.abs(diff) > 1 ? "ões" : ""}</span>`;
  return `<span style="color:#9ca3af;font-size:12px;">= Manteve posição</span>`;
}

function getTip(d: BusinessDigest): string {
  if (d.ranking_score < 50 && !d.has_schedule) return "💡 Adicione horário de funcionamento para subir no ranking.";
  if (d.new_reviews === 0) return "💡 Peça aos seus clientes uma avaliação — aumenta a confiança no perfil.";
  if (!d.has_whatsapp) return "💡 Active o WhatsApp no perfil para mais contactos directos.";
  if (d.views_this_week > 0 && d.contacts_this_week === 0) return "💡 O seu perfil tem visitas mas sem contactos — reveja a descrição.";
  if (!d.has_description) return "💡 Escreva uma descrição detalhada para atrair mais clientes.";
  return "💡 Mantenha o perfil actualizado para continuar a crescer!";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function buildEmailHtml(d: BusinessDigest, unsubscribeUrl: string): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStart = formatDate(weekAgo);
  const weekEnd = formatDate(now);

  const isPaidPlan = d.plan_id && d.plan_id !== "free" && d.plan_id !== "";

  let badgeHtml = "";
  if (d.badges_earned.length > 0) {
    badgeHtml = d.badges_earned.map(b =>
      `<div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
        <div style="font-size:24px;">🏅</div>
        <div style="color:#4caf50;font-weight:600;font-size:14px;margin-top:4px;">${b.name}</div>
      </div>`
    ).join("");
  }

  let optionalCards = "";
  if (d.new_reviews > 0) {
    optionalCards += `
      <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
        <div style="font-size:24px;">⭐</div>
        <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.new_reviews}</div>
        <div style="color:#9ca3af;font-size:12px;">Avaliações novas</div>
      </div>`;
  }
  if (d.new_requests > 0) {
    optionalCards += `
      <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
        <div style="font-size:24px;">📩</div>
        <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.new_requests}</div>
        <div style="color:#9ca3af;font-size:12px;">Pedidos recebidos</div>
      </div>`;
  }

  const upgradeBlock = !isPaidPlan ? `
    <div style="background:#1a2e1a;border:1px solid #2d5a2d;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <div style="font-size:20px;margin-bottom:8px;">⚡</div>
      <p style="color:#a3d9a5;font-size:14px;margin:0 0 12px 0;">
        Está no plano <strong>Gratuito</strong>. Quer ver métricas detalhadas, benchmarking e receber pedidos directos?
      </p>
      <a href="https://pededireto.lovable.app/business-dashboard?tab=plan"
         style="background:#4caf50;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
        Conhecer os planos →
      </a>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;margin:0;padding:0;">
  <div style="background:#0d0d0d;padding:40px 20px;">
    <div style="max-width:560px;margin:0 auto;">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="color:#4caf50;font-size:28px;font-weight:700;">📊 Resumo Semanal</div>
        <div style="color:#9ca3af;font-size:13px;margin-top:4px;">Semana de ${weekStart} a ${weekEnd}</div>
      </div>

      <!-- Greeting -->
      <p style="color:#e5e7eb;font-size:15px;line-height:1.6;">
        Olá <strong style="color:#ffffff;">${d.owner_name}</strong>! Aqui está o resumo desta semana para o <strong style="color:#4caf50;">${d.business_name}</strong>:
      </p>

      <!-- Metric Cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        <!-- Views -->
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">👁</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.views_this_week}</div>
          <div style="color:#9ca3af;font-size:12px;">Visitas</div>
          <div style="margin-top:4px;">${renderDelta(d.views_this_week, d.views_prev_week > 0 || d.contacts_prev_week > 0 ? d.views_prev_week : null)}</div>
        </div>
        
        <!-- Contacts -->
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">📞</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.contacts_this_week}</div>
          <div style="color:#9ca3af;font-size:12px;">Contactos</div>
          <div style="margin-top:4px;">${renderDelta(d.contacts_this_week, d.contacts_prev_week > 0 || d.views_prev_week > 0 ? d.contacts_prev_week : null)}</div>
        </div>
        
        ${d.position_now !== null ? `
        <!-- Ranking -->
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">🏆</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">#${d.position_now}</div>
          <div style="color:#9ca3af;font-size:12px;">Ranking</div>
          <div style="margin-top:4px;">${renderPositionDelta(d.position_now, d.position_prev)}</div>
        </div>` : ""}
        
        ${optionalCards}
      </div>

      ${badgeHtml ? `
      <div style="margin:16px 0;">
        <div style="color:#e5e7eb;font-size:14px;font-weight:600;margin-bottom:8px;">🏅 Badges conquistados esta semana</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${badgeHtml}
        </div>
      </div>` : ""}

      <!-- Tip -->
      <div style="background:#1a2e1a;border-left:3px solid #4caf50;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;">
        <p style="color:#a3d9a5;font-size:14px;margin:0;">${getTip(d)}</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="https://pededireto.lovable.app/business-dashboard?tab=insights"
           style="background:#4caf50;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Ver análise completa →
        </a>
      </div>

      ${upgradeBlock}

      <!-- Footer -->
      <hr style="border:none;border-top:1px solid #333;margin:28px 0;" />
      <p style="color:#6b7280;font-size:11px;text-align:center;line-height:1.6;">
        Recebe este email porque tem um negócio no Pede Direto.<br/>
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

function generateUnsubscribeToken(businessId: string, secret: string): string {
  // Simple HMAC-like token using business_id + secret
  const encoder = new TextEncoder();
  const data = encoder.encode(businessId + secret);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]) | 0;
  }
  return Math.abs(hash).toString(36);
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
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const UNSUBSCRIBE_SECRET = Deno.env.get("CRON_SECRET") || "pededireto-unsub";
    const BASE_URL = Deno.env.get("SUPABASE_URL")!;

    // 1. Check minimum threshold: >= 20 claimed active businesses
    const { count: claimedCount } = await adminClient
      .from("business_users")
      .select("business_id", { count: "exact", head: true })
      .eq("role", "owner");

    // Cross-check with active businesses
    const { data: activeClaimedList } = await adminClient
      .rpc("get_weekly_digest_recipients");

    // Fallback: manual query if RPC doesn't exist
    let recipients: any[] = [];
    if (activeClaimedList) {
      recipients = activeClaimedList;
    } else {
      const { data: bizUsers } = await adminClient
        .from("business_users")
        .select(`
          business_id,
          user_id,
          businesses!inner(id, name, plan_id, subcategory_id, is_active, ranking_score, whatsapp, description, schedule),
          profiles!inner(email, full_name, user_id)
        `)
        .eq("role", "owner")
        .eq("businesses.is_active", true);

      if (bizUsers) {
        for (const bu of bizUsers) {
          const biz = (bu as any).businesses;
          const prof = (bu as any).profiles;
          if (!prof?.email) continue;

          // Check email preferences
          const { data: pref } = await adminClient
            .from("business_email_preferences")
            .select("weekly_digest")
            .eq("business_id", biz.id)
            .maybeSingle();

          if (pref && pref.weekly_digest === false) continue;

          recipients.push({
            business_id: biz.id,
            business_name: biz.name,
            plan_id: biz.plan_id,
            subcategory_id: biz.subcategory_id,
            ranking_score: biz.ranking_score || 0,
            has_whatsapp: !!biz.whatsapp,
            has_description: !!biz.description,
            has_schedule: !!biz.schedule,
            owner_name: prof.full_name || "Responsável",
            owner_email: prof.email,
          });
        }
      }
    }

    if (recipients.length < 20) {
      console.log(`Only ${recipients.length} eligible businesses. Minimum is 20. Skipping digest.`);
      return new Response(JSON.stringify({
        ok: true,
        skipped: true,
        reason: `Aguardando mínimo de 20 negócios (actual: ${recipients.length})`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending weekly digest to ${recipients.length} businesses`);

    let sent = 0;
    let errors = 0;

    for (const r of recipients) {
      try {
        // Fetch metrics for this business
        const { data: thisWeekData } = await adminClient
          .from("analytics_events")
          .select("event_type")
          .eq("business_id", r.business_id)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const { data: prevWeekData } = await adminClient
          .from("analytics_events")
          .select("event_type")
          .eq("business_id", r.business_id)
          .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const views_this_week = (thisWeekData || []).filter(e => e.event_type === "view").length;
        const contacts_this_week = (thisWeekData || []).filter(e => e.event_type?.startsWith("click_")).length;
        const views_prev_week = (prevWeekData || []).filter(e => e.event_type === "view").length;
        const contacts_prev_week = (prevWeekData || []).filter(e => e.event_type?.startsWith("click_")).length;

        // Ranking snapshots
        const today = new Date().toISOString().split("T")[0];
        const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const { data: currentSnap } = await adminClient
          .from("business_ranking_snapshots")
          .select("position")
          .eq("business_id", r.business_id)
          .eq("snapshot_date", today)
          .maybeSingle();

        const { data: prevSnap } = await adminClient
          .from("business_ranking_snapshots")
          .select("position")
          .eq("business_id", r.business_id)
          .eq("snapshot_date", weekAgoDate)
          .maybeSingle();

        // New reviews
        const { count: newReviews } = await adminClient
          .from("business_reviews")
          .select("id", { count: "exact", head: true })
          .eq("business_id", r.business_id)
          .eq("moderation_status", "approved")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // New requests
        const { count: newRequests } = await adminClient
          .from("request_business_matches")
          .select("id", { count: "exact", head: true })
          .eq("business_id", r.business_id)
          .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        // Badges earned
        const { data: badgesData } = await adminClient
          .from("business_earned_badges")
          .select("business_badges(name, icon_url)")
          .eq("business_id", r.business_id)
          .gte("earned_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const badges_earned = (badgesData || []).map((b: any) => ({
          name: b.business_badges?.name || "Badge",
          icon_url: b.business_badges?.icon_url || null,
        }));

        const digest: BusinessDigest = {
          business_id: r.business_id,
          business_name: r.business_name,
          plan_id: r.plan_id,
          subcategory_id: r.subcategory_id,
          owner_name: r.owner_name,
          owner_email: r.owner_email,
          views_this_week,
          views_prev_week,
          contacts_this_week,
          contacts_prev_week,
          position_now: currentSnap?.position || null,
          position_prev: prevSnap?.position || null,
          new_reviews: newReviews || 0,
          new_requests: newRequests || 0,
          badges_earned,
          ranking_score: r.ranking_score || 0,
          has_whatsapp: r.has_whatsapp,
          has_description: r.has_description,
          has_schedule: r.has_schedule,
        };

        const token = generateUnsubscribeToken(r.business_id, UNSUBSCRIBE_SECRET);
        const unsubscribeUrl = `${BASE_URL}/functions/v1/unsubscribe-digest?business_id=${r.business_id}&token=${token}`;

        const html = buildEmailHtml(digest, unsubscribeUrl);
        const subject = `📊 Resumo semanal — ${r.business_name}`;

        // Send via Resend
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pede Direto <noreply@pededireto.pt>",
            to: [r.owner_email],
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
            },
          }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
          console.error(`Failed to send to ${r.owner_email}:`, resendData);
          errors++;
          continue;
        }

        // Log email
        await adminClient.from("email_logs").insert({
          recipient_email: r.owner_email,
          recipient_type: "business",
          recipient_id: r.business_id,
          subject,
          html_content: html,
          provider: "resend",
          provider_id: resendData.id,
          provider_status: "sent",
          metadata: {
            type: "weekly-digest",
            views: views_this_week,
            contacts: contacts_this_week,
            position: currentSnap?.position,
          },
        });

        sent++;

        // Small delay to respect Resend rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (innerErr) {
        console.error(`Error processing ${r.business_name}:`, innerErr);
        errors++;
      }
    }

    console.log(`Weekly digest complete: ${sent} sent, ${errors} errors`);

    return new Response(JSON.stringify({
      ok: true,
      sent,
      errors,
      total: recipients.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Weekly digest error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
