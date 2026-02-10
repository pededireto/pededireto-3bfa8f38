import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const graceDate = new Date(today);
    graceDate.setDate(graceDate.getDate() - GRACE_PERIOD_DAYS);
    const graceDateStr = graceDate.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    console.log(`[check-subscriptions] Running expiry check. Today: ${todayStr}, Grace cutoff: ${graceDateStr}`);

    // Find businesses with active paid subscriptions that have expired beyond grace period
    // Exclude businesses without a plan or with free plans (price = 0)
    const { data: expiredBusinesses, error: fetchError } = await supabase
      .from("businesses")
      .select("id, name, subscription_end_date, plan_id, subscription_price, cta_whatsapp, cta_phone, cta_email")
      .eq("subscription_status", "active")
      .not("plan_id", "is", null)
      .lt("subscription_end_date", graceDateStr);

    if (fetchError) {
      console.error("[check-subscriptions] Error fetching expired businesses:", fetchError);
      throw fetchError;
    }

    console.log(`[check-subscriptions] Found ${expiredBusinesses?.length || 0} candidates`);

    const expiredList: any[] = [];
    let updatedCount = 0;

    if (expiredBusinesses && expiredBusinesses.length > 0) {
      // Get plan details for all affected businesses
      const planIds = [...new Set(expiredBusinesses.map(b => b.plan_id).filter(Boolean))];
      const { data: plans } = await supabase
        .from("commercial_plans")
        .select("id, name, price")
        .in("id", planIds);

      const planMap = new Map((plans || []).map(p => [p.id, p]));

      for (const business of expiredBusinesses) {
        const plan = planMap.get(business.plan_id);
        
        // Skip free plans (price = 0)
        if (plan && plan.price === 0) {
          console.log(`[check-subscriptions] Skipping free plan business: ${business.name}`);
          continue;
        }

        // Deactivate the business
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            subscription_status: "expired",
            is_active: false,
          })
          .eq("id", business.id);

        if (updateError) {
          console.error(`[check-subscriptions] Failed to expire ${business.name}:`, updateError);
          continue;
        }

        // Log to expiration_logs
        const logEntry = {
          business_id: business.id,
          plan_name: plan?.name || "Desconhecido",
          plan_price: plan?.price || business.subscription_price || 0,
          expired_at: business.subscription_end_date,
        };

        const { error: logError } = await supabase
          .from("expiration_logs")
          .insert(logEntry);

        if (logError) {
          console.error(`[check-subscriptions] Failed to log expiration for ${business.name}:`, logError);
        }

        console.log(`[check-subscriptions] Expired: ${business.name} (plan: ${plan?.name}, end: ${business.subscription_end_date})`);
        
        expiredList.push({
          id: business.id,
          name: business.name,
          plan_name: plan?.name || "Desconhecido",
          plan_price: plan?.price || business.subscription_price || 0,
          expired_at: business.subscription_end_date,
          whatsapp: business.cta_whatsapp,
          phone: business.cta_phone,
          email: business.cta_email,
        });
        updatedCount++;
      }
    }

    const result = {
      date: todayStr,
      grace_period_days: GRACE_PERIOD_DAYS,
      checked: expiredBusinesses?.length || 0,
      expired: updatedCount,
      expired_businesses: expiredList,
    };

    console.log("[check-subscriptions] Complete:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[check-subscriptions] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
