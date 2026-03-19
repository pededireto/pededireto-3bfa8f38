import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface MonthlyDigest {
  business_id: string;
  business_name: string;
  plan_id: string | null;
  owner_name: string;
  owner_email: string;
  views_this_month: number;
  views_prev_month: number;
  contacts_this_month: number;
  contacts_prev_month: number;
  position_now: number | null;
  ranking_score: number;
  has_whatsapp: boolean;
  has_description: boolean;
  has_schedule: boolean;
  subcategory_name: string | null;
}

function renderDelta(current: number, previous: number): string {
  if (previous === 0 && current === 0) return `<span style="color:#9ca3af;font-size:12px;">Sem dados</span>`;
  if (previous === 0) return `<span style="color:#16a34a;font-size:12px;">↑ Novo</span>`;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `<span style="color:#16a34a;font-size:12px;">↑ +${pct}% vs mês anterior</span>`;
  if (pct < 0) return `<span style="color:#ef4444;font-size:12px;">↓ ${pct}% vs mês anterior</span>`;
  return `<span style="color:#9ca3af;font-size:12px;">= Sem alteração</span>`;
}

function getTip(d: MonthlyDigest): string {
  if (!d.has_schedule) return "💡 Adicione horário de funcionamento para subir no ranking.";
  if (!d.has_whatsapp) return "💡 Active o WhatsApp no perfil para mais contactos directos.";
  if (d.views_this_month > 0 && d.contacts_this_month === 0) return "💡 O seu perfil tem visitas mas sem contactos — reveja a descrição e adicione mais fotos.";
  if (!d.has_description) return "💡 Escreva uma descrição detalhada para atrair mais clientes.";
  if (d.contacts_this_month > 5) return "💡 Parabéns! Está a receber bons contactos. Considere adicionar mais fotos e vídeos para converter ainda mais.";
  return "💡 Mantenha o perfil actualizado para continuar a crescer!";
}

function getMonthName(month: number): string {
  const names = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return names[month] || "";
}

function buildEmailHtml(d: MonthlyDigest, monthName: string, year: number, unsubscribeUrl: string): string {
  const ctr = d.views_this_month > 0
    ? ((d.contacts_this_month / d.views_this_month) * 100).toFixed(1)
    : "0.0";

  const isPaidPlan = d.plan_id && d.plan_id !== "free" && d.plan_id !== "";

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
      
      <div style="text-align:center;margin-bottom:24px;">
        <div style="color:#4caf50;font-size:28px;font-weight:700;">📊 Relatório Mensal</div>
        <div style="color:#9ca3af;font-size:13px;margin-top:4px;">${monthName} ${year}</div>
      </div>

      <p style="color:#e5e7eb;font-size:15px;line-height:1.6;">
        Olá <strong style="color:#ffffff;">${d.owner_name}</strong>! Aqui está o resumo de <strong style="color:#4caf50;">${monthName}</strong> para o <strong style="color:#4caf50;">${d.business_name}</strong>:
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">👁</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.views_this_month}</div>
          <div style="color:#9ca3af;font-size:12px;">Visualizações</div>
          <div style="margin-top:4px;">${renderDelta(d.views_this_month, d.views_prev_month)}</div>
        </div>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">📞</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${d.contacts_this_month}</div>
          <div style="color:#9ca3af;font-size:12px;">Cliques Totais</div>
          <div style="margin-top:4px;">${renderDelta(d.contacts_this_month, d.contacts_prev_month)}</div>
        </div>
        
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">📈</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">${ctr}%</div>
          <div style="color:#9ca3af;font-size:12px;">CTR</div>
        </div>

        ${d.position_now !== null ? `
        <div style="background:#1a1a1a;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;">🏆</div>
          <div style="color:#ffffff;font-weight:700;font-size:22px;">#${d.position_now}</div>
          <div style="color:#9ca3af;font-size:12px;">Ranking${d.subcategory_name ? ` (${d.subcategory_name})` : ""}</div>
        </div>` : ""}
      </div>

      <div style="background:#1a2e1a;border-left:3px solid #4caf50;border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;">
        <p style="color:#a3d9a5;font-size:14px;margin:0;">${getTip(d)}</p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="https://pededireto.lovable.app/business-dashboard?tab=insights"
           style="background:#4caf50;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
          Ver análise completa →
        </a>
      </div>

      ${upgradeBlock}

      <hr style="border:none;border-top:1px solid #333;margin:28px 0;" />
      <p style="color:#6b7280;font-size:11px;text-align:center;line-height:1.6;">
        Recebe este email porque tem um negócio no Pede Direto.<br/>
        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Cancelar subscrição do relatório mensal</a>
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
      console.error("[monthly-digest] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const UNSUBSCRIBE_SECRET = Deno.env.get("CRON_SECRET") || "pededireto-unsub";
    const BASE_URL = Deno.env.get("SUPABASE_URL")!;
    const today = new Date();
    const todayDay = today.getDate();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Previous month dates for metrics
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
    const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1);
    const twoMonthsAgoEnd = new Date(prevMonthStart.getTime() - 1);
    const twoMonthsAgoStart = new Date(twoMonthsAgoEnd.getFullYear(), twoMonthsAgoEnd.getMonth(), 1);

    const prevMonthName = getMonthName(prevMonthStart.getMonth());
    const prevMonthYear = prevMonthStart.getFullYear();

    console.log(`[monthly-digest] Running for day ${todayDay}, reporting on ${prevMonthName} ${prevMonthYear}`);

    // Find businesses whose claimed_at day matches today's day
    // Also handle month-end: if today is last day of month, include businesses with claim day > today's day
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const isLastDayOfMonth = todayDay === lastDayOfMonth;

    const { data: allBizUsers, error: bizErr } = await adminClient
      .from("business_users")
      .select("business_id, user_id")
      .eq("role", "owner");

    if (bizErr || !allBizUsers) {
      console.error("[monthly-digest] Failed to fetch business_users:", bizErr);
      return new Response(JSON.stringify({ error: "Failed to fetch businesses" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const bu of allBizUsers) {
      try {
        // Fetch business details
        const { data: biz } = await adminClient
          .from("businesses")
          .select("id, name, plan_id, is_active, claimed_at, ranking_score, cta_whatsapp, description, schedule")
          .eq("id", bu.business_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!biz || !biz.claimed_at) {
          skipped++;
          continue;
        }

        // Check if the claim day matches today
        const claimDay = new Date(biz.claimed_at).getDate();
        const shouldSendToday = claimDay === todayDay || (isLastDayOfMonth && claimDay > todayDay);

        if (!shouldSendToday) {
          skipped++;
          continue;
        }

        // Check if already sent for this month
        const { data: alreadySent } = await adminClient
          .from("monthly_digest_logs")
          .select("id")
          .eq("business_id", biz.id)
          .eq("sent_for_month", currentMonth)
          .maybeSingle();

        if (alreadySent) {
          skipped++;
          continue;
        }

        // Check email preferences
        const { data: pref } = await adminClient
          .from("business_email_preferences")
          .select("weekly_digest")
          .eq("business_id", biz.id)
          .maybeSingle();

        if (pref && pref.weekly_digest === false) {
          skipped++;
          continue;
        }

        // Get owner profile
        const { data: profile } = await adminClient
          .from("profiles")
          .select("email, full_name")
          .eq("id", bu.user_id)
          .maybeSingle();

        if (!profile?.email) {
          skipped++;
          continue;
        }

        // Fetch metrics for previous month
        const { data: thisMonthEvents } = await adminClient
          .from("analytics_events")
          .select("event_type")
          .eq("business_id", biz.id)
          .gte("created_at", prevMonthStart.toISOString())
          .lt("created_at", new Date(prevMonthEnd.getTime() + 24 * 60 * 60 * 1000).toISOString());

        const { data: prevMonthEvents } = await adminClient
          .from("analytics_events")
          .select("event_type")
          .eq("business_id", biz.id)
          .gte("created_at", twoMonthsAgoStart.toISOString())
          .lt("created_at", new Date(twoMonthsAgoEnd.getTime() + 24 * 60 * 60 * 1000).toISOString());

        const views_this = (thisMonthEvents || []).filter(e => e.event_type === "view").length;
        const contacts_this = (thisMonthEvents || []).filter(e => e.event_type?.startsWith("click_")).length;
        const views_prev = (prevMonthEvents || []).filter(e => e.event_type === "view").length;
        const contacts_prev = (prevMonthEvents || []).filter(e => e.event_type?.startsWith("click_")).length;

        // Get ranking position
        const { data: rankSnap } = await adminClient
          .from("business_ranking_snapshots")
          .select("position, subcategory_id")
          .eq("business_id", biz.id)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get subcategory name if available
        let subcategoryName: string | null = null;
        if (rankSnap?.subcategory_id) {
          const { data: sub } = await adminClient
            .from("subcategories")
            .select("name")
            .eq("id", rankSnap.subcategory_id)
            .maybeSingle();
          subcategoryName = sub?.name || null;
        }

        const digest: MonthlyDigest = {
          business_id: biz.id,
          business_name: biz.name,
          plan_id: biz.plan_id,
          owner_name: profile.full_name || "Responsável",
          owner_email: profile.email,
          views_this_month: views_this,
          views_prev_month: views_prev,
          contacts_this_month: contacts_this,
          contacts_prev_month: contacts_prev,
          position_now: rankSnap?.position || null,
          ranking_score: biz.ranking_score || 0,
          has_whatsapp: !!biz.cta_whatsapp,
          has_description: !!biz.description,
          has_schedule: !!biz.schedule,
          subcategory_name: subcategoryName,
        };

        const token = generateUnsubscribeToken(biz.id, UNSUBSCRIBE_SECRET);
        const unsubscribeUrl = `${BASE_URL}/functions/v1/unsubscribe-digest?business_id=${biz.id}&token=${token}`;

        const html = buildEmailHtml(digest, prevMonthName, prevMonthYear, unsubscribeUrl);
        const subject = `📊 Relatório Mensal — ${biz.name}`;

        // Send via Resend
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pede Direto <noreply@pededireto.pt>",
            to: [profile.email],
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
            },
          }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
          console.error(`[monthly-digest] Failed to send to ${profile.email}:`, resendData);
          errors++;
          continue;
        }

        // Log to email_logs
        await adminClient.from("email_logs").insert({
          recipient_email: profile.email,
          recipient_type: "business",
          recipient_id: biz.id,
          subject,
          html_content: html,
          provider: "resend",
          provider_id: resendData.id,
          provider_status: "sent",
          sent_at: new Date().toISOString(),
        });

        // Log to monthly_digest_logs to prevent duplicates
        await adminClient.from("monthly_digest_logs").insert({
          business_id: biz.id,
          sent_for_month: currentMonth,
          recipient_email: profile.email,
        });

        sent++;
        console.log(`[monthly-digest] Sent to ${profile.email} for ${biz.name}`);

        // Rate limiting between sends
        await new Promise((r) => setTimeout(r, 300));

      } catch (innerErr) {
        console.error(`[monthly-digest] Error processing business ${bu.business_id}:`, innerErr);
        errors++;
      }
    }

    console.log(`[monthly-digest] Complete: sent=${sent}, skipped=${skipped}, errors=${errors}`);

    return new Response(JSON.stringify({
      ok: true,
      sent,
      skipped,
      errors,
      month: currentMonth,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[monthly-digest] Unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
