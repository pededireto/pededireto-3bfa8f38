import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    console.log(`[check-subscriptions] Running expiry check for date: ${today}`);

    // Find businesses with active subscriptions that have expired
    const { data: expiredBusinesses, error: fetchError } = await supabase
      .from("businesses")
      .select("id, name, subscription_end_date")
      .eq("subscription_status", "active")
      .lt("subscription_end_date", today);

    if (fetchError) {
      console.error("[check-subscriptions] Error fetching expired businesses:", fetchError);
      throw fetchError;
    }

    console.log(`[check-subscriptions] Found ${expiredBusinesses?.length || 0} expired subscriptions`);

    let updatedCount = 0;

    if (expiredBusinesses && expiredBusinesses.length > 0) {
      for (const business of expiredBusinesses) {
        const { error: updateError } = await supabase
          .from("businesses")
          .update({
            subscription_status: "expired",
            is_active: false,
          })
          .eq("id", business.id);

        if (updateError) {
          console.error(`[check-subscriptions] Failed to expire business ${business.name} (${business.id}):`, updateError);
        } else {
          console.log(`[check-subscriptions] Expired: ${business.name} (end: ${business.subscription_end_date})`);
          updatedCount++;
        }
      }
    }

    const result = {
      date: today,
      checked: expiredBusinesses?.length || 0,
      expired: updatedCount,
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
