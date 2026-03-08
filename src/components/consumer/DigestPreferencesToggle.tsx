import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useConsumerDigestPreferences, useToggleConsumerDigest } from "@/hooks/useConsumerDigestPreferences";
import { useToast } from "@/hooks/use-toast";

const DigestPreferencesToggle = () => {
  const { data: prefs, isLoading } = useConsumerDigestPreferences();
  const toggle = useToggleConsumerDigest();
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    toggle.mutate(checked, {
      onSuccess: () =>
        toast({
          title: checked ? "Resumo semanal ativado" : "Resumo semanal desativado",
          description: checked
            ? "Receberá um email semanal com o resumo da sua atividade."
            : "Não receberá mais o resumo semanal por email.",
        }),
      onError: () =>
        toast({ title: "Erro ao guardar preferência", variant: "destructive" }),
    });
  };

  if (isLoading) return null;

  return (
    <Card className="border-border/50">
      <CardContent className="flex items-center justify-between py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Resumo semanal por email</p>
            <p className="text-xs text-muted-foreground">Receba um resumo da sua atividade todas as semanas</p>
          </div>
        </div>
        <Switch
          checked={prefs?.weekly_digest ?? true}
          onCheckedChange={handleToggle}
          disabled={toggle.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default DigestPreferencesToggle;
