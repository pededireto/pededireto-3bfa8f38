import { Search, Users, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HowItWorks = () => {
  const { data: settings } = useSiteSettings();

  const title = settings?.how_it_works_title || "Como funciona";

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
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-2">Simples, rápido e sem complicações</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                <step.icon className="w-7 h-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[hsl(var(--cta))] text-white text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
