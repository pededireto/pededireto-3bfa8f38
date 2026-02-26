import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

async function stripeGet(endpoint: string) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Stripe API error");
  return data;
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
  if (!res.ok) throw new Error(data?.error?.message || "Stripe API error");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const { action, product_ids } = await req.json();

    if (action === "list") {
      // Fetch all products (paginate if needed)
      const allProducts: any[] = [];
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const url = startingAfter
          ? `/products?limit=100&starting_after=${startingAfter}`
          : `/products?limit=100`;
        const data = await stripeGet(url);
        allProducts.push(...data.data);
        hasMore = data.has_more;
        if (hasMore && data.data.length > 0) {
          startingAfter = data.data[data.data.length - 1].id;
        }
      }

      return new Response(JSON.stringify({ products: allProducts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "archive") {
      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        throw new Error("No product_ids provided");
      }

      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of product_ids) {
        try {
          await stripePost(`/products/${id}`, { active: "false" });
          results.push({ id, success: true });
        } catch (err) {
          results.push({ id, success: false, error: err.message });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'list' or 'archive'.");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
