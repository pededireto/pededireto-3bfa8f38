import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";

interface BusinessCTAProps {
  config?: Record<string, any> | null;
}

const BusinessCTA = ({ config }: BusinessCTAProps) => {
  const { data: settings } = useSiteSettings();
  const { user } = useAuth();

  const title = config?.title || settings?.business_cta_title || "O teu negócio merece aparecer a quem realmente procura.";
  const subtitle =
    config?.subtitle ||
    settings?.business_cta_subtitle ||
    "Cria presença na plataforma, recebe contactos diretos e transforma visitas em pedidos reais.";
  const badge = config?.badge || "Para negócios locais";
  const bullets = Array.isArray(config?.bullets) && config.bullets.filter(Boolean).length
    ? config.bullets.filter(Boolean)
    : ["Mais visibilidade local", "Contactos diretos", "Configuração simples no backoffice"];
  const primaryText = config?.primary_cta_text || "Registar o meu negócio";
  const primaryLink = config?.primary_cta_link || "/claim-business";
  const secondaryText = config?.secondary_cta_text || "Ver planos";
  const secondaryLink = config?.secondary_cta_link || (user ? "/pedir-servico" : "/pricing");

  const isSecondarySearchFlow = secondaryLink === "/top" || secondaryLink === "/pedir-servico";

  return (
    <section className="py-14 md:py-20 bg-primary text-primary-foreground">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
            {badge}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold">{title}</h2>
          <p className="mx-auto max-w-2xl text-base opacity-80 md:text-lg">{subtitle}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {bullets.map((bullet: string) => (
              <span key={bullet} className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 font-medium">
                {bullet}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button asChild size="lg" variant="secondary" className="font-bold text-base px-8 rounded-xl">
              <Link to={primaryLink}>
                {primaryText} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-bold text-base px-8 rounded-xl"
            >
              <Link to={secondaryLink}>
                {isSecondarySearchFlow && <Search className="mr-2 h-5 w-5" />} {secondaryText}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessCTA;
