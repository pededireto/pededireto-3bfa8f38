import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useBusinessCount = () => {
  return useQuery({
    queryKey: ["business-count-cta"],
    queryFn: async () => {
      const { count } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      return count || 0;
    },
    staleTime: 300000,
  });
};

const BusinessCTA = () => {
  const { data: settings } = useSiteSettings();
  const { data: count = 0 } = useBusinessCount();

  const title = settings?.business_cta_title || "É um profissional ou negócio local?";
  const subtitle = settings?.business_cta_subtitle || `Junte-se a ${count}+ negócios já registados na Pede Direto`;
  const buttonText = settings?.business_cta_button || "Registar o meu negócio — é grátis";

  return (
    <section className="py-12 md:py-16" style={{ background: "var(--gradient-cta)" }}>
      <div className="container text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        <p className="text-lg text-white/90 max-w-lg mx-auto">
          {subtitle.includes("{count}") ? subtitle.replace("{count}", String(count)) : subtitle}
        </p>
        <Button
          asChild
          size="lg"
          className="bg-white text-[hsl(var(--cta))] hover:bg-white/90 font-bold text-base px-8"
        >
          <Link to="/register/choice">
            {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default BusinessCTA;
