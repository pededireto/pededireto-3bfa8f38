import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, BarChart3, MousePointerClick, Search, Lock } from "lucide-react";

const features = [
  { icon: TrendingUp, label: "Comparação com período anterior" },
  { icon: Clock, label: "Hora e dia de pico dos teus clientes" },
  { icon: MousePointerClick, label: "Breakdown de contactos por canal" },
  { icon: BarChart3, label: "Gráfico de tendência detalhado" },
  { icon: Search, label: "Procuras na tua categoria e cidade" },
];

const UpgradeAnalyticsCard = () => {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div className="h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center absolute -bottom-1 -right-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold">Desbloqueie o Analytics Pro</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Tome decisões mais inteligentes com dados detalhados sobre o comportamento dos seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full max-w-xs text-left">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              {f.label}
            </div>
          ))}
        </div>

        <Button className="mt-2 px-8">
          Melhorar Plano
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradeAnalyticsCard;
