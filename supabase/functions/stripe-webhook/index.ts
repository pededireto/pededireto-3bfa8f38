import Stripe from "https://esm.sh/stripe@13.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // Dev mode sem secret
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.business_id;
        const planId = session.metadata?.plan_id;

        if (!businessId || !planId) {
          console.error("Missing metadata in checkout session");
          break;
        }

        // Buscar duração do plano
        const { data: plan } = await adminClient
          .from("commercial_plans")
          .select("duration_months, price")
          .eq("id", planId)
          .single();

        const startDate = new Date();
        const endDate = new Date();
        if (plan?.duration_months) {
          endDate.setMonth(endDate.getMonth() + plan.duration_months);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const { error } = await adminClient
          .from("businesses")
          .update({
            plan_id: planId,
            subscription_status: "active",
            subscription_start_date: startDate.toISOString().split("T")[0],
            subscription_end_date: endDate.toISOString().split("T")[0],
            subscription_price: plan?.price ?? 0,
            is_active: true,
          })
          .eq("id", businessId);

        if (error) {
          console.error("Error updating business after payment:", error);
        } else {
          console.log(`Business ${businessId} activated with plan ${planId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.subscription as string;
        if (!sub) break;

        const subscription = await stripe.subscriptions.retrieve(sub);
        const businessId = subscription.metadata?.business_id;
        const planId = subscription.metadata?.plan_id;

        if (!businessId) break;

        const { data: plan } = await adminClient
          .from("commercial_plans")
          .select("duration_months, price")
          .eq("id", planId)
          .maybeSingle();

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (plan?.duration_months ?? 1));

        await adminClient
          .from("businesses")
          .update({
            subscription_status: "active",
            subscription_end_date: endDate.toISOString().split("T")[0],
          })
          .eq("id", businessId);

        console.log(`Subscription renewed for business ${businessId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.business_id;
        if (!businessId) break;

        await adminClient
          .from("businesses")
          .update({ subscription_status: "expired" })
          .eq("id", businessId);

        console.log(`Subscription cancelled for business ${businessId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
