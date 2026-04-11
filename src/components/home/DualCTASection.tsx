import { ArrowRight, CheckCircle2, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface DualCTASectionProps {
  config?: Record<string, any> | null;
}

const DualCTASection = ({ config }: DualCTASectionProps) => {
  const { user } = useAuth();

  const normalizeBullets = (value: unknown, fallback: string[]) => {
    if (Array.isArray(value)) {
      const cleaned = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      return cleaned.length ? cleaned : fallback;
    }
    return fallback;
  };

  const leftBadge = config?.left_badge || "Para quem procura";
  const leftTitle = config?.left_title || "Encontra rapidamente quem resolve";
  const leftBullets = normalizeBullets(config?.left_bullets, ["Profissionais perto de ti", "Contacto direto", "Sem complicações"]);
  const leftCtaText = config?.left_cta_text || "Encontrar serviço →";
  const leftCtaLink = config?.left_cta_link || "/top";
  const leftImage = config?.left_image || null;

  const rightBadge = config?.right_badge || "Para empresas";
  const rightTitle = config?.right_title || "Estão à tua procura. Vais aparecer?";
  const rightSubtitle = config?.right_subtitle || "Clientes entram todos os dias à procura de profissionais como tu.";
  const rightBullets = normalizeBullets(config?.right_bullets, ["Mais visibilidade", "Mais contactos", "Mais clientes"]);
  const rightCta1Text = config?.right_cta1_text || "Encontrar o meu negócio";
  const rightCta1Link = config?.right_cta1_link || "/claim-business";
  const rightCta2Text = config?.right_cta2_text || "Criar perfil grátis";
  const rightCta2Link = config?.right_cta2_link || "/register";
  const rightImage = config?.right_image || null;

  const resolvedRightCta2Link = config?.right_cta2_link || (user ? "/pedir-servico" : "/register");

  return (
    <section className="py-14 md:py-20 bg-muted/30">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Left — Consumer */}
          <div className="rounded-2xl bg-primary p-8 md:p-10 text-primary-foreground flex flex-col">
            {leftImage && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-primary-foreground/15">
                <img src={leftImage} alt={leftTitle} className="h-44 w-full object-cover" loading="lazy" />
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-3">{leftBadge}</p>
            <h3 className="text-xl md:text-2xl font-bold mb-4">{leftTitle}</h3>
            <ul className="space-y-2 mb-8 flex-1">
              {leftBullets.map((b: string) => (
                <li key={b} className="flex items-start gap-2 text-sm text-primary-foreground/90">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl w-full sm:w-auto">
              <Link to={leftCtaLink}>{leftCtaText}</Link>
            </Button>
          </div>

          {/* Right — Business */}
          <div className="rounded-2xl bg-card border border-border p-8 md:p-10 flex flex-col shadow-sm">
            {rightImage && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-border">
                <img src={rightImage} alt={rightTitle} className="h-44 w-full object-cover" loading="lazy" />
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{rightBadge}</p>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{rightTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4">{rightSubtitle}</p>
            <ul className="space-y-2 mb-8 flex-1">
              {rightBullets.map((b: string) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl">
                <Link to={rightCta1Link}>
                  <Briefcase className="mr-2 h-4 w-4" /> {rightCta1Text}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl font-semibold">
                <Link to={resolvedRightCta2Link}>{rightCta2Text}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DualCTASection;
