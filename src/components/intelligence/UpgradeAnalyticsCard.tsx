import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Lock } from "lucide-react";

const UpgradeAnalyticsCard = () => {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="relative">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
          <Lock className="h-5 w-5 text-muted-foreground absolute -bottom-1 -right-1" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Analytics Pro</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Descubra quantas vezes o seu negócio aparece em pesquisas, obtenha insights de performance e aumente a sua visibilidade.
          </p>
        </div>
        <Button className="mt-2">Melhorar Plano</Button>
      </CardContent>
    </Card>
  );
};

export default UpgradeAnalyticsCard;
