import { useState } from "react";
import { useTeamMembers, useCreateTeamMember, useDeleteTeamMember } from "@/hooks/useTeamManagement";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Users, Search } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  commercial: { label: "Equipa Comercial", emoji: "🏪", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  onboarding: { label: "Onboarding Team", emoji: "🎯", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  cs: { label: "Customer Success", emoji: "💬", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  admin: { label: "Administrador", emoji: "👑", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  super_admin: { label: "Super Admin", emoji: "⭐", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

const TeamManagement = () => {
  const { toast } = useToast();
  const { data: members = [], isPending } = useTeamMembers();
  const createMember = useCreateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("commercial");
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (filterRole !== "all" && m.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember.mutateAsync({ email, password, full_name: fullName, role });
      toast({ title: "Membro criado", description: `${email} adicionado como ${ROLE_CONFIG[role]?.label}` });
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("commercial");
    } catch (err: any) {
      const detail = err?.details || err?.hint || err?.message || "Erro desconhecido";
      const code = err?.code ? ` (${err.code})` : "";
      toast({ title: "Erro ao criar membro", description: `${detail}${code}`, variant: "destructive" });
      console.error("[TeamManagement] create error:", err);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    try {
      await deleteMember.mutateAsync(userId);
      toast({ title: "Membro removido", description: `${name || "Utilizador"} foi removido da equipa.` });
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  if (isPending) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Equipa Pede Direto</h1>
          <p className="text-muted-foreground">Gerir todos os membros da equipa interna</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Adicionar Membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro à Equipa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="membro@pededireto.pt" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Departamento *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">🏪 Equipa Comercial</SelectItem>
                    <SelectItem value="onboarding">🎯 Onboarding Team</SelectItem>
                    <SelectItem value="cs">💬 Customer Success</SelectItem>
                    <SelectItem value="admin">👑 Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMember.isPending}>
                  {createMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Conta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="commercial">🏪 Comercial</SelectItem>
            <SelectItem value="onboarding">🎯 Onboarding</SelectItem>
            <SelectItem value="cs">💬 CS</SelectItem>
            <SelectItem value="admin">👑 Admin</SelectItem>
            <SelectItem value="super_admin">⭐ Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const count = members.filter((m) => m.role === key).length;
          if (count === 0 && key === "super_admin") return null;
          return (
            <div key={key} className="bg-card rounded-lg border p-3 text-center">
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">{cfg.emoji} {cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Departamento</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Desde</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Último login</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const cfg = ROLE_CONFIG[member.role] || { label: member.role, emoji: "❓", color: "bg-muted text-muted-foreground" };
                return (
                  <tr key={member.user_id} className="border-t border-border">
                    <td className="p-4 font-medium">{member.full_name || "—"}</td>
                    <td className="p-4 text-muted-foreground text-sm">{member.email}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={cfg.color}>
                        {cfg.emoji} {cfg.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {member.last_sign_in_at
                        ? new Date(member.last_sign_in_at).toLocaleDateString("pt-PT")
                        : "Nunca"}
                    </td>
                    <td className="p-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tens a certeza que queres remover <strong>{member.full_name || member.email}</strong> da equipa? Esta ação é irreversível e apaga a conta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(member.user_id, member.full_name || member.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
