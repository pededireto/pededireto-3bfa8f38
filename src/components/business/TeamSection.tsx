import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusinessTeam } from "@/hooks/useBusinessMembership";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, User, UserPlus, Trash2, Loader2, Shield, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TeamSectionProps {
  businessId: string;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }> = {
  owner: { label: "Proprietário", icon: Crown, variant: "default" },
  manager: { label: "Administrador", icon: Shield, variant: "secondary" },
  staff: { label: "Operacional", icon: Wrench, variant: "outline" },
  pending_owner: { label: "Pendente", icon: User, variant: "outline" },
};

const TeamSection = ({ businessId }: TeamSectionProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: team = [], isLoading } = useBusinessTeam(businessId);
  const { data: membership } = useBusinessMembership();

  const myRole = membership?.role as string | undefined;
  const canManage = myRole === "owner" || myRole === "manager";
  const isOwner = myRole === "owner";

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("staff");

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase.rpc("invite_business_member", {
        p_business_id: businessId,
        p_email: email,
        p_role: role as any,
      });
      if (error) throw error;
      const result = data as any;
      if (result && !result.success) {
        if (result.error === "user_not_found") {
          throw new Error("Utilizador não encontrado com este email.");
        }
        throw new Error(result.error || "Erro desconhecido");
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Membro convidado com sucesso!" });
      qc.invalidateQueries({ queryKey: ["business-team"] });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("remove_business_member", {
        p_business_id: businessId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Membro removido" });
      qc.invalidateQueries({ queryKey: ["business-team"] });
    },
    onError: () => {
      toast({ title: "Erro ao remover membro", variant: "destructive" });
    },
  });

  const canRemoveMember = (memberRole: string) => {
    if (isOwner && memberRole !== "owner") return true;
    if (myRole === "manager" && memberRole === "staff") return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Equipa
          </h1>
          <p className="text-muted-foreground">Gerir os membros da equipa do negócio</p>
        </div>

        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro</DialogTitle>
                <DialogDescription>
                  Introduz o email do utilizador que pretendes adicionar à equipa.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Função</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && <SelectItem value="manager">Administrador</SelectItem>}
                      <SelectItem value="staff">Operacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-1" />
                  )}
                  Convidar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : team.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center border border-border">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Sem membros na equipa.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {team.map((m) => {
              const role = m.role as string;
              const cfg = roleConfig[role] || { label: role, icon: User, variant: "outline" as const };
              const Icon = cfg.icon;

              return (
                <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      role === "owner" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(m.profiles as any)?.full_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(m.profiles as any)?.email || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={cfg.variant} className="text-xs">
                      {cfg.label}
                    </Badge>
                    {canRemoveMember(role) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tens a certeza que queres remover {(m.profiles as any)?.full_name || "este membro"} da equipa? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeMutation.mutate(m.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {removeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Remover"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSection;
