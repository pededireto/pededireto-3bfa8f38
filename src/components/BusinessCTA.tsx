import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";

const BusinessCTA = () => {
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();

  const title = settings?.business_cta_title || "Resolve o que precisas — agora.";
  const subtitle = settings?.business_cta_subtitle || "Encontra profissionais ou mostra o teu negócio a milhares de pessoas.";

  const quoteCTALink = user ? "/pedir-servico" : "/register";

  return (
    <section className="py-14 md:py-20 bg-[hsl(123_30%_18%)]">
      <div className="container text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        <p className="text-base text-white/80 max-w-md mx-auto">{subtitle}</p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-bold text-base px-8 rounded-xl"
          >
            <Link to="/top">
              <Search className="mr-2 h-5 w-5" /> Encontrar serviço
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 font-bold text-base px-8 rounded-xl"
          >
            <Link to={quoteCTALink}>
              Pedir Orçamento Gratuito <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BusinessCTA;
