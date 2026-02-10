import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CommercialUsersContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch commercial users via user_roles
  const { data: commercialUsers = [], isLoading } = useQuery({
    queryKey: ["commercial-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "commercial");

      if (error) throw error;

      // Fetch profiles for these users
      if (data.length === 0) return [];
      const userIds = data.map(r => r.user_id);
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (pError) throw pError;
      return profiles || [];
    },
  });

  const handleCreateCommercial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsCreating(true);

    try {
      // Use edge function to create user and assign role
      const { data, error } = await supabase.functions.invoke("manage-commercial-user", {
        body: { action: "create", email, password, full_name: fullName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Comercial criado", description: `Conta criada para ${email}` });
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      queryClient.invalidateQueries({ queryKey: ["commercial-users"] });
    } catch (err: any) {
      toast({ title: "Erro ao criar comercial", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Equipa Comercial</h1>
          <p className="text-muted-foreground">Gerir utilizadores comerciais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-cta-primary">
              <Plus className="h-4 w-4 mr-2" /> Novo Comercial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Conta Comercial</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCommercial} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do comercial" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="comercial@pededireto.pt" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {commercialUsers.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-8 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum comercial registado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Desde</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {commercialUsers.map((user: any) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="p-4 font-medium">{user.full_name || "—"}</td>
                  <td className="p-4 text-muted-foreground">{user.email || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-success/10 text-success">Ativo</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommercialUsersContent;
