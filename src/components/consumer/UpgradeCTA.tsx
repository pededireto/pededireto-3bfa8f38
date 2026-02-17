import { Crown, Sparkles, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConsumerPlan } from "@/hooks/useConsumerPlan";
import { Link } from "react-router-dom";

interface UpgradeCTAProps {
  variant?: "card" | "banner" | "inline";
  feature?: string;
}

export const UpgradeCTA = ({ variant = "card", feature }: UpgradeCTAProps) => {
  const { data: userPlan } = useConsumerPlan();

  // Don't show if user already has a paid plan
  if (userPlan?.plan?.slug && userPlan.plan.slug !== "free") return null;

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Descubra o Premium</p>
              <p className="text-sm text-muted-foreground">
                {feature || "Favoritos ilimitados e muito mais"}
              </p>
            </div>
          </div>
          <Link to="/upgrade">
            <Button size="sm">
              Ver Planos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="text-center py-6 space-y-3">
        <Sparkles className="w-8 h-8 text-primary mx-auto" />
        <p className="font-medium">Funcionalidade Premium</p>
        <p className="text-sm text-muted-foreground">
          {feature || "Esta funcionalidade"} está disponível no plano Premium
        </p>
        <Link to="/upgrade">
          <Button size="sm">Fazer Upgrade</Button>
        </Link>
      </div>
    );
  }

  // card variant (default)
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Desbloqueie Todo o Potencial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {["Favoritos ilimitados", "Pedidos ilimitados", "Pesquisa avançada", "Sem anúncios"].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            {f}
          </div>
        ))}
        <div className="pt-2">
          <span className="text-2xl font-bold">4.99€</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/upgrade" className="w-full">
          <Button className="w-full">
            Fazer Upgrade Agora <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
