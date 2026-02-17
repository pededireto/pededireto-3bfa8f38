import { useState, useEffect } from "react";
import { useOnboardingBusinesses, useBulkUpdateBusinessStatus } from "@/hooks/useOnboardingData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Power, PowerOff, UserPlus, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CLAIM_COLORS: Record<string, string> = {
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  unclaimed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  revoked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const OnboardingBusinesses = () => {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // Debounced
  const [claimStatus, setClaimStatus] = useState("all");
  const [isActive, setIsActive] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Debounce search (espera 500ms após utilizador parar de escrever)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: businesses = [], isPending } = useOnboardingBusinesses({ 
    claimStatus, 
    isActive: isActive === "all" ? undefined : isActive, 
    search 
  });
  
  const bulkUpdate = useBulkUpdateBusinessStatus();

  // Estado para modal de associação
  const [associateDialog, setAssociateDialog] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isAssociating, setIsAssociating] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === businesses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(businesses.map((b: any) => b.id)));
    }
  };

  const handleBulkAction = async (activate: boolean) => {
    if (selected.size === 0) return;
    try {
      await bulkUpdate.mutateAsync({ ids: Array.from(selected), is_active: activate });
      toast({ 
        title: activate ? "Negócios ativados" : "Negócios desativados", 
        description: `${selected.size} negócios atualizados.` 
      });
      setSelected(new Set());
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssociating(true);

    try {
      const emailToSearch = userEmail.toLowerCase().trim();

      console.log("🔍 A procurar utilizador:", emailToSearch);

      // 1. Buscar todos os utilizadores via RPC
      const { data: allUsersData, error: usersError } = await supabase
        .rpc("get_all_users_for_onboarding" as any);

      if (usersError) {
        console.error("❌ Erro RPC:", usersError);
        toast({ 
          title: "❌ Erro ao buscar utilizadores", 
          description: usersError.message,
          variant: "destructive" 
        });
        setIsAssociating(false);
        return;
      }

      // A função retorna JSONB, que já vem como array JS
      const allUsers: any[] = Array.isArray(allUsersData) ? allUsersData : [];

      console.log("👥 Total de utilizadores encontrados:", allUsers.length);
      console.log("📋 Primeiros 3 emails:", allUsers.slice(0, 3).map((u: any) => u.email));

      if (allUsers.length === 0) {
        toast({ 
          title: "❌ Nenhum utilizador encontrado", 
          description: "A base de dados não tem utilizadores registados.",
          variant: "destructive" 
        });
        setIsAssociating(false);
        return;
      }

      // 2. Encontrar utilizador pelo email
      const foundUser = allUsers.find((u: any) => 
        u.email?.toLowerCase() === emailToSearch
      );

      if (!foundUser) {
        console.log("❌ Utilizador não encontrado");
        console.log("📧 Emails disponíveis:", allUsers.slice(0, 5).map((u: any) => u.email));
        
        toast({ 
          title: "❌ Utilizador não encontrado", 
          description: `Nenhum utilizador com o email "${userEmail}" existe. Verifica se está correto.`,
          variant: "destructive",
          duration: 5000
        });
        setIsAssociating(false);
        return;
      }

      console.log("✅ Utilizador encontrado:", foundUser.email, "ID:", foundUser.id);

      // 3. Verificar se já existe associação
      const { data: existingAssoc } = await supabase
        .from("business_users")
        .select("id, role")
        .eq("user_id", foundUser.id)
        .eq("business_id", selectedBusiness.id)
        .maybeSingle();

      if (existingAssoc) {
        console.log("⚠️ Associação já existe");
        toast({ 
          title: "⚠️ Associação já existe", 
          description: `Este utilizador já está associado como ${existingAssoc.role}.`,
          variant: "destructive" 
        });
        setIsAssociating(false);
        return;
      }

      console.log("📝 A criar associação...");

      // 4. Criar associação em business_users
      const { error: assocError } = await supabase
        .from("business_users")
        .insert({
          user_id: foundUser.id,
          business_id: selectedBusiness.id,
          role: "owner"
        });

      if (assocError) {
        console.error("❌ Erro ao associar:", assocError);
        toast({ 
          title: "❌ Erro ao associar", 
          description: assocError.message,
          variant: "destructive" 
        });
        setIsAssociating(false);
        return;
      }

      console.log("✅ Associação criada!");

      // 5. Atualizar claim_status para verified e ativar
      const { error: claimError } = await supabase
        .from("businesses")
        .update({ 
          claim_status: "verified",
          is_active: true
        })
        .eq("id", selectedBusiness.id);

      if (claimError) {
        console.error("⚠️ Erro ao atualizar claim:", claimError);
      } else {
        console.log("✅ Negócio atualizado para verified!");
      }

      toast({ 
        title: "✅ Associação concluída!", 
        description: `${userEmail} é agora owner de "${selectedBusiness.name}"`,
        duration: 5000
      });

      setAssociateDialog(false);
      setUserEmail("");
      setSelectedBusiness(null);

    } catch (err: any) {
      console.error("💥 Erro geral:", err);
      toast({ 
        title: "❌ Erro inesperado", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsAssociating(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🏢 Negócios</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={claimStatus} onValueChange={setClaimStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Claims</SelectItem>
            <SelectItem value="verified">✅ Verified</SelectItem>
            <SelectItem value="unclaimed">⬜ Unclaimed</SelectItem>
            <SelectItem value="pending">⏳ Pending</SelectItem>
            <SelectItem value="revoked">❌ Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.size} selecionados</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction(true)} disabled={bulkUpdate.isPending}>
            <Power className="h-3 w-3 mr-1" /> Ativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction(false)} disabled={bulkUpdate.isPending}>
            <PowerOff className="h-3 w-3 mr-1" /> Desativar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-10">
                <Checkbox 
                  checked={selected.size === businesses.length && businesses.length > 0} 
                  onCheckedChange={toggleAll} 
                />
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Nome</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Cidade</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Estado</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Claim</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Owner</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Criado</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="p-3">
                  <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} />
                </td>
                <td className="p-3 font-medium text-sm">{b.name}</td>
                <td className="p-3 text-sm text-muted-foreground">{b.city || "—"}</td>
                <td className="p-3">
                  <Badge variant={b.is_active ? "default" : "secondary"} className="text-xs">
                    {b.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className={`text-xs ${CLAIM_COLORS[b.claim_status] || ""}`}>
                    {b.claim_status || "unclaimed"}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{b.owner_name || b.owner_email || "—"}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {b.created_at ? new Date(b.created_at).toLocaleDateString("pt-PT") : "—"}
                </td>
                <td className="p-3">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setSelectedBusiness(b);
                      setAssociateDialog(true);
                    }}
                    title="Associar utilizador"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum negócio encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{businesses.length} negócios encontrados</p>

      {/* MODAL ASSOCIAR UTILIZADOR */}
      <Dialog open={associateDialog} onOpenChange={setAssociateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associar Utilizador a Negócio</DialogTitle>
          </DialogHeader>
          {selectedBusiness && (
            <form onSubmit={handleAssociate} className="space-y-4">
              <div className="space-y-2">
                <Label>Negócio</Label>
                <Input value={selectedBusiness.name} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email do Utilizador *</Label>
                <Input 
                  type="email"
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  placeholder="email@exemplo.pt"
                  required 
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  ℹ️ O utilizador será associado como <strong>owner</strong>, o negócio ficará <strong>verified</strong> e será <strong>ativado</strong> automaticamente.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAssociateDialog(false);
                    setUserEmail("");
                  }}
                  disabled={isAssociating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isAssociating}>
                  {isAssociating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A associar...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Associar
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingBusinesses;
