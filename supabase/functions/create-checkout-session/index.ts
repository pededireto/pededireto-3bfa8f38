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

    if (!planId || !price || !businessId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const origin = req.headers.get("origin") || "https://pededireto.pt";
    const successUrl = `${origin}/business-dashboard?payment=success&plan=${planId}`;
    const cancelUrl = `${origin}/business-dashboard?payment=cancelled`;

    const isSepa = paymentMethod === "sepa";
    const isMbway = paymentMethod === "mbway";

    let session;

    if (isSepa) {
      // SEPA Debit — suporta subscription e payment
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["sepa_debit"],
        mode: "payment", // usar payment para cobranças únicas; usar subscription para recorrente
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          business_id: businessId,
          plan_id: planId,
          payment_method: "sepa",
        },
        payment_intent_data: {
          metadata: {
            business_id: businessId,
            plan_id: planId,
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(price * 100),
              product_data: {
                name: `Pede Direto — ${planName}`,
                description: "Subscrição Pede Direto Business",
              },
            },
          },
        ],
      });
    } else if (isMbway) {
      // MB Way — apenas payment, não suporta subscriptions
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["mb_way"],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          business_id: businessId,
          plan_id: planId,
          payment_method: "mbway",
        },
        payment_intent_data: {
          metadata: {
            business_id: businessId,
            plan_id: planId,
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(price * 100),
              product_data: {
                name: `Pede Direto — ${planName}`,
                description: "Plano Pede Direto Business",
              },
            },
          },
        ],
        // MB Way precisa de número de telefone
        phone_number_collection: {
          enabled: true,
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment method. Use 'mbway' or 'sepa'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checkout session created: ${session.id} for business ${businessId}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Stripe checkout error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
