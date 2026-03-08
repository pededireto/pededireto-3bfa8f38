import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminBadgesPanelProps {
  businessId: string;
}

const AdminBadgesPanel = ({ businessId }: AdminBadgesPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch all badges
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ["business-badges-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_badges")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch earned badges for this business
  const { data: earnedBadges = [], isLoading: loadingEarned } = useQuery({
    queryKey: ["business-earned-badges", businessId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_earned_badges")
        .select("*")
        .eq("business_id", businessId);
      if (error) throw error;
      return data as any[];
    },
  });

  const earnedBadgeIds = new Set(earnedBadges.map((b: any) => b.badge_id));

  // Assign badge
  const assignMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await (supabase as any)
        .from("business_earned_badges")
        .insert({
          badge_id: badgeId,
          business_id: businessId,
          granted_by: user?.id,
          earned_automatically: false,
          notes: "Atribuído manualmente pelo admin",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-earned-badges", businessId] });
      toast({ title: "Badge atribuído com sucesso" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao atribuir badge", description: e.message, variant: "destructive" });
    },
  });

  // Remove badge
  const removeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await (supabase as any)
        .from("business_earned_badges")
        .delete()
        .eq("badge_id", badgeId)
        .eq("business_id", businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-earned-badges", businessId] });
      toast({ title: "Badge removido" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao remover badge", description: e.message, variant: "destructive" });
    },
  });

  if (loadingBadges || loadingEarned) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Gestão de Badges</h3>
        <Badge variant="secondary" className="text-xs">
          {earnedBadges.length} atribuídos
        </Badge>
      </div>

      <div className="grid gap-3">
        {allBadges.map((badge: any) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const earned = earnedBadges.find((e: any) => e.badge_id === badge.id);
          const isPending = assignMutation.isPending || removeMutation.isPending;

          return (
            <div
              key={badge.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isEarned ? "border-primary/30 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{badge.icon_url || "🏅"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{badge.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                  {isEarned && earned && (
                    <p className="text-xs text-primary mt-0.5">
                      {earned.earned_automatically ? "Automático" : "Manual"} •{" "}
                      {new Date(earned.earned_at).toLocaleDateString("pt-PT")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                {isEarned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                    onClick={() => removeMutation.mutate(badge.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => assignMutation.mutate(badge.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Atribuir
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {allBadges.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum badge definido no sistema.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminBadgesPanel;
