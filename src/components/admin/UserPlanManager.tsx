import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAllConsumerPlans } from "@/hooks/useConsumerPlan";

interface UserPlanManagerProps {
  userId: string;
  currentPlanId?: string;
  currentPlanSlug?: string;
  userName: string;
}

export const UserPlanManager = ({ userId, currentPlanId, currentPlanSlug, userName }: UserPlanManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: plans = [] } = useAllConsumerPlans();
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || "");
  const [expiresAt, setExpiresAt] = useState("");

  const updatePlan = useMutation({
    mutationFn: async () => {
      // Update profile
      await (supabase as any)
        .from("profiles")
        .update({
          consumer_plan_id: selectedPlanId || null,
          consumer_plan_expires_at: expiresAt || null,
        })
        .eq("id", userId);

      // Log change
      const currentUser = (await supabase.auth.getUser()).data.user;
      await (supabase as any).from("plan_changes").insert({
        user_id: userId,
        old_plan_id: currentPlanId || null,
        new_plan_id: selectedPlanId || null,
        changed_by: currentUser?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumer-plan"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-users"] });
      toast({ title: "Plano atualizado com sucesso" });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar plano", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Crown className="w-4 h-4" />
        Gerir Plano
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerir Plano de {userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="font-medium">{currentPlanSlug || "Nenhum"}</p>
            </div>

            <div className="space-y-2">
              <Label>Novo Plano</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - {Number(p.price_monthly).toFixed(2)}€/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expira em (opcional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => updatePlan.mutate()} disabled={updatePlan.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
