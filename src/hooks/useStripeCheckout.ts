import { supabase } from "@/integrations/supabase/client";

interface CheckoutParams {
  planId: string;
  planName: string;
  price: number;
  businessId: string;
  paymentMethod: "mbway" | "sepa";
}

export const useStripeCheckout = () => {
  const checkout = async (params: CheckoutParams) => {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: params,
    });

    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return { checkout };
};
