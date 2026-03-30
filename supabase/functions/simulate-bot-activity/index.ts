import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SimulationRequest {
  actions: ("views" | "clicks" | "reviews")[];
  reviewRating?: number; // 1-5
  reviewCount?: number; // how many reviews per bot
  viewCount?: number; // views per bot
  clickCount?: number; // clicks per bot
  targetBusinessIds?: string[]; // specific businesses, or random if empty
}

const REVIEW_COMMENTS: Record<number, string[]> = {
  1: [
    "Experiência muito fraca, não recomendo.",
    "Serviço abaixo do esperado.",
    "Muito desiludido com o atendimento.",
  ],
  2: [
    "Poderia ser melhor, experiência medíocre.",
    "Não correspondeu às expectativas.",
    "Serviço razoável mas com muitos pontos a melhorar.",
  ],
  3: [
    "Serviço aceitável, nada de especial.",
    "Experiência normal, dentro do esperado.",
    "Cumpre o mínimo, mas sem destaque.",
  ],
  4: [
    "Bom serviço, recomendo!",
    "Muito satisfeito com a experiência.",
    "Boa qualidade e bom atendimento.",
    "Profissional e eficiente.",
  ],
  5: [
    "Excelente! Superou todas as expectativas.",
    "Serviço impecável, 5 estrelas merecidas!",
    "Fantástico! Recomendo vivamente.",
    "O melhor da zona, sem dúvida.",
  ],
};

const CLICK_TYPES = ["click_phone", "click_whatsapp", "click_email", "click_website", "click_instagram", "click_facebook", "click_reservation", "click_order"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SimulationRequest = await req.json();
    const { actions, reviewRating = 4, reviewCount = 1, viewCount = 3, clickCount = 2, targetBusinessIds } = body;

    // Get bot users
    const { data: bots } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, full_name, email")
      .like("email", "%@pededireto.test");

    if (!bots || bots.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum BOT encontrado. Crie-os primeiro." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target businesses
    let businesses: { id: string; name: string; category_id: string | null; city: string | null }[];
    if (targetBusinessIds && targetBusinessIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("businesses")
        .select("id, name, category_id, city")
        .in("id", targetBusinessIds)
        .eq("is_active", true);
      businesses = data || [];
    } else {
      const { data } = await supabaseAdmin
        .from("businesses")
        .select("id, name, category_id, city")
        .eq("is_active", true)
        .limit(20);
      businesses = data || [];
    }

    if (businesses.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum negócio activo encontrado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = { views: 0, clicks: 0, reviews: 0 };
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Generate views
    if (actions.includes("views")) {
      const viewEvents: any[] = [];
      for (const bot of bots) {
        for (let i = 0; i < viewCount; i++) {
          const biz = pick(businesses);
          viewEvents.push({
            event_type: "view",
            business_id: biz.id,
            category_id: biz.category_id,
            city: biz.city,
            user_id: bot.user_id || bot.id,
          });
        }
      }
      const { error } = await supabaseAdmin.from("analytics_events").insert(viewEvents);
      if (!error) results.views = viewEvents.length;
    }

    // Generate clicks
    if (actions.includes("clicks")) {
      const clickEvents: any[] = [];
      for (const bot of bots) {
        for (let i = 0; i < clickCount; i++) {
          const biz = pick(businesses);
          clickEvents.push({
            event_type: pick(CLICK_TYPES),
            business_id: biz.id,
            category_id: biz.category_id,
            city: biz.city,
            user_id: bot.user_id || bot.id,
          });
        }
      }
      const { error } = await supabaseAdmin.from("analytics_events").insert(clickEvents);
      if (!error) results.clicks = clickEvents.length;
    }

    // Generate reviews
    if (actions.includes("reviews")) {
      const comments = REVIEW_COMMENTS[reviewRating] || REVIEW_COMMENTS[4];
      for (const bot of bots) {
        for (let i = 0; i < reviewCount; i++) {
          const biz = pick(businesses);
          const { error } = await supabaseAdmin.from("business_reviews").insert({
            business_id: biz.id,
            user_id: bot.user_id || bot.id,
            rating: reviewRating,
            comment: pick(comments),
            title: `Avaliação de ${bot.full_name || "Bot"}`,
            is_verified: false,
            moderation_status: "approved",
          });
          if (!error) results.reviews++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
