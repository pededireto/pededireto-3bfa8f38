import { Check, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllConsumerPlans, useConsumerPlan } from "@/hooks/useConsumerPlan";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const UpgradePage = () => {
  const { data: plans = [] } = useAllConsumerPlans();
  const { data: userPlan } = useConsumerPlan();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="text-center mb-12">
            <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Planos Premium</h1>
            <p className="text-lg text-muted-foreground">Escolha o plano ideal para si</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan: any) => {
              const isCurrentPlan = userPlan?.plan?.id === plan.id;
              const isPopular = plan.slug === "premium";

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isPopular ? "border-primary shadow-lg scale-105" : ""}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Mais Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-4xl font-bold">
                        {Number(plan.price_monthly).toFixed(2)}€
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.price_yearly > 0 && (
                      <p className="text-sm text-muted-foreground">
                        ou {Number(plan.price_yearly).toFixed(2)}€/ano (poupa{" "}
                        {Math.round(100 - (plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                      </p>
                    )}
                    <div className="space-y-2 pt-2">
                      {(plan.features as string[])?.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan
                        ? "Plano Atual"
                        : plan.slug === "free"
                          ? "Gratuito"
                          : "Subscrever"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UpgradePage;
