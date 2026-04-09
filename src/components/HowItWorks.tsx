import { Search, Users, MessageCircle, ArrowRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HowItWorks = () => {
  const { data: settings } = useSiteSettings();

  const title = settings?.how_it_works_title || "Funciona assim:";

  const steps = [
    {
      icon: Search,
      number: "1",
      title: settings?.how_it_works_step1_title || "Descreva o que precisa",
      description: settings?.how_it_works_step1_desc || "Escreva o serviço ou problema que tem. Canalizador, eletricista, restaurante — o que precisar.",
    },
    {
      icon: Users,
      number: "2",
      title: settings?.how_it_works_step2_title || "Encontre profissionais",
      description: settings?.how_it_works_step2_desc || "Veja perfis completos, avaliações reais e contactos directos de profissionais na sua zona.",
    },
    {
      icon: MessageCircle,
      number: "3",
      title: settings?.how_it_works_step3_title || "Contacte diretamente",
      description: settings?.how_it_works_step3_desc || "Ligue, envie WhatsApp ou peça orçamento — sem intermediários nem comissões.",
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-card">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">{title}</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center space-y-4 group">
              {/* Number badge */}
              <div className="relative mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-9 h-9 text-primary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>

              {/* Arrow between steps (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 translate-x-1/2">
                  <ArrowRight className="w-6 h-6 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
