import { useState } from "react";
import { useOnboardingBusinesses, useBulkUpdateBusinessStatus } from "@/hooks/useOnboardingData";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Power, PowerOff } from "lucide-react";

const CLAIM_COLORS: Record<string, string> = {
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  unclaimed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  revoked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const OnboardingBusinesses = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [claimStatus, setClaimStatus] = useState("all");
  const [isActive, setIsActive] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: businesses = [], isPending } = useOnboardingBusinesses({ claimStatus, isActive: isActive === "all" ? undefined : isActive, search });
  const bulkUpdate = useBulkUpdateBusinessStatus();

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
      toast({ title: activate ? "Negócios ativados" : "Negócios desativados", description: `${selected.size} negócios atualizados.` });
      setSelected(new Set());
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (isPending) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🏢 Negócios</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                <Checkbox checked={selected.size === businesses.length && businesses.length > 0} onCheckedChange={toggleAll} />
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Nome</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Cidade</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Estado</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Claim</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Owner</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Criado</th>
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
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum negócio encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{businesses.length} negócios encontrados</p>
    </div>
  );
};

export default OnboardingBusinesses;
