import Stripe from "https://esm.sh/stripe@13.11.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, planName, price, businessId, paymentMethod } = await req.json();

    // SEPA = recorrente (subscription), MB Way = único (payment)
    const isRecurring = paymentMethod === "sepa";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: isRecurring ? ["sepa_debit"] : ["card", "mb_way"],
      mode: isRecurring ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/dashboard?payment=success&plan=${planId}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?payment=cancelled`,
      metadata: {
        business_id: businessId,
        plan_id: planId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(price * 100), // converter euros para cêntimos
            product_data: {
              name: `Pede Direto — ${planName}`,
            },
            ...(isRecurring && {
              recurring: {
                interval: "month",
              },
            }),
          },
        },
      ],
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Stripe error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
