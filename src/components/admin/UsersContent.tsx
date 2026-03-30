import { useState, useMemo } from "react";
import {
  useAllUsers,
  useUserRequestCounts,
  useUpdateUserStatus,
  useConfirmUserEmail,
  useFixUserRole,
} from "@/hooks/useUsers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, UserCheck, UserX, Shield, Building2, MailCheck, AlertTriangle } from "lucide-react";
import AdminUserRoleEditorModal from "./AdminUserRoleEditorModal";
import AdminUserBusinessManager from "./AdminUserBusinessManager";

const UsersContent = () => {
  const { data: users = [], isLoading } = useAllUsers();
  const { data: requestCounts = {} } = useUserRequestCounts();
  const updateStatus = useUpdateUserStatus();
  const confirmEmail = useConfirmUserEmail();
  const fixRole = useFixUserRole();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleModal, setRoleModal] = useState<{ userId: string; role?: string } | null>(null);
  const [bizModal, setBizModal] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").includes(search);
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const toggleStatus = async (userId: string, current: string) => {
    const newStatus = current === "active" ? "suspended" : "active";
    try {
      await updateStatus.mutateAsync({ userId, status: newStatus });
      toast({ title: newStatus === "active" ? "Utilizador ativado" : "Utilizador suspenso" });
    } catch {
      toast({ title: "Erro ao alterar estado", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Utilizadores</h1>
        <p className="text-muted-foreground">Gestão de utilizadores registados na plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="suspended">Suspensos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</p>
          <p className="text-sm text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">{users.filter((u) => u.status === "suspended").length}</p>
          <p className="text-sm text-muted-foreground">Suspensos</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-2xl font-bold">
            {
              users.filter((u) => {
                if (!u.last_activity_at) return false;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(u.last_activity_at) >= thirtyDaysAgo;
              }).length
            }
          </p>
          <p className="text-sm text-muted-foreground">Ativos 30d</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Registo</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Pedidos</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/20">
                <td className="p-4 font-medium">
                  <div className="flex items-center gap-2">
                    {user.full_name || "—"}
                    {/* Badge de role — só mostra se tiver role */}
                    {user.app_role && (
                      <Badge variant="outline" className="text-xs hidden lg:inline-flex">
                        {user.app_role}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{user.email || "—"}</span>
                    {!user.email_confirmed_at && (
                      <Badge
                        variant="outline"
                        className="text-xs border-yellow-500/50 text-yellow-600 dark:text-yellow-400 shrink-0"
                      >
                        Não confirmado
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{user.phone || "—"}</td>
                <td className="p-4 text-muted-foreground hidden lg:table-cell">
                  {new Date(user.created_at).toLocaleDateString("pt-PT")}
                </td>
                <td className="p-4 text-center">{requestCounts[user.user_id] || 0}</td>
                <td className="p-4 text-center">
                  <Badge variant={user.status === "active" ? "default" : "destructive"}>
                    {user.status === "active" ? "Ativo" : "Suspenso"}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Editar Role"
                      onClick={() => setRoleModal({ userId: user.id, role: user.app_role || undefined })}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Gerir Negócios" onClick={() => setBizModal(user.id)}>
                      <Building2 className="h-4 w-4" />
                    </Button>
                    {/* Botão confirmar email — só se não confirmado */}
                    {!user.email_confirmed_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Confirmar email manualmente"
                        onClick={() => confirmEmail.mutate(user.id)}
                        disabled={confirmEmail.isPending}
                      >
                        <MailCheck className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    {/* Botão corrigir role — só se não tiver role atribuído */}
                    {!user.app_role && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Sem role — clica para atribuir 'user'"
                        onClick={() => fixRole.mutate(user.id)}
                        disabled={fixRole.isPending}
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleStatus(user.id, user.status)}
                      title={user.status === "active" ? "Suspender" : "Ativar"}
                    >
                      {user.status === "active" ? (
                        <UserX className="h-4 w-4 text-destructive" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado.</p>
        )}
      </div>

      {/* Modals */}
      {roleModal && (
        <AdminUserRoleEditorModal
          userId={roleModal.userId}
          open={true}
          onClose={() => setRoleModal(null)}
          initialRole={roleModal.role}
        />
      )}
      {bizModal && <AdminUserBusinessManager userId={bizModal} open={true} onClose={() => setBizModal(null)} />}
    </div>
  );
};

export default UsersContent;
