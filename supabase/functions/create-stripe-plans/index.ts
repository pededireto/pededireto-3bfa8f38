import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

interface PlanInput {
  name: string;
  unit_amount: number;
  interval: "month" | "year";
  interval_count: number;
}

interface PlanResult {
  name: string;
  stripe_product_id: string;
  stripe_price_id: string;
  error?: string;
}

async function stripePost(endpoint: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Stripe API error");
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const { plans } = (await req.json()) as { plans: PlanInput[] };

    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      throw new Error("No plans provided");
    }

    const results: PlanResult[] = [];

    for (const plan of plans) {
      try {
        // Create product
        const product = await stripePost("/products", {
          name: plan.name,
          currency: "eur",
        });

        // Create price
        const price = await stripePost("/prices", {
          product: product.id,
          unit_amount: String(plan.unit_amount),
          currency: "eur",
          "recurring[interval]": plan.interval,
          "recurring[interval_count]": String(plan.interval_count),
        });

        results.push({
          name: plan.name,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
        });
      } catch (err) {
        results.push({
          name: plan.name,
          stripe_product_id: "",
          stripe_price_id: "",
          error: err.message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
