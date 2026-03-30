import { useState } from "react";
import { useAllBusinessAddons, useCreateAddon, useDeactivateAddon, getAddonStatus } from "@/hooks/useBusinessAddons";
import { useAllBusinesses } from "@/hooks/useBusinesses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Power, Search, Zap, AlertTriangle } from "lucide-react";
import { format, addMonths, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const BusinessAddonsManager = () => {
  const { data: addons = [], isLoading } = useAllBusinessAddons();
  const { data: businesses = [] } = useAllBusinesses();
  const createAddon = useCreateAddon();
  const deactivateAddon = useDeactivateAddon();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [activatedAt, setActivatedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [durationMonths, setDurationMonths] = useState(1);
  const [isTrial, setIsTrial] = useState(false);

  const filteredBusinesses = businesses.filter(
    (b: any) => b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const computedEndDate = isTrial
    ? addDays(new Date(activatedAt), 15)
    : addMonths(new Date(activatedAt), durationMonths);

  const handleCreate = async () => {
    if (!selectedBusiness) return;
    try {
      await createAddon.mutateAsync({
        business_id: selectedBusiness,
        activated_at: activatedAt,
        duration_months: isTrial ? 1 : durationMonths, // trial is 15 days but stored as 1 month, checked via is_trial
        is_trial: isTrial,
      });
      toast({ title: "Add-on activado com sucesso" });
      setShowForm(false);
      setSelectedBusiness("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Desactivar este add-on?")) return;
    await deactivateAddon.mutateAsync(id);
    toast({ title: "Add-on desactivado" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Marketing AI — Add-ons</h2>
          <p className="text-sm text-muted-foreground">Gerir subscrições do Marketing AI Studio por negócio</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Activar Add-on
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activar Marketing AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Negócio *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar negócio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchTerm && filteredBusinesses.length > 0 && (
                <div className="mt-1 border border-border rounded-lg max-h-40 overflow-auto bg-popover">
                  {filteredBusinesses.slice(0, 10).map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBusiness(b.id); setSearchTerm(b.name); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      {b.name} <span className="text-muted-foreground">· {b.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Data de activação</label>
                <Input type="date" value={activatedAt} onChange={(e) => setActivatedAt(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duração (meses)</label>
                <Select
                  value={String(durationMonths)}
                  onValueChange={(v) => setDurationMonths(Number(v))}
                  disabled={isTrial}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 6, 12].map((m) => (
                      <SelectItem key={m} value={String(m)}>{m} {m === 1 ? "mês" : "meses"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isTrial} onCheckedChange={setIsTrial} />
              <span className="text-sm">Trial (15 dias)</span>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                Data fim: <span className="font-medium text-foreground">
                  {format(computedEndDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                </span>
                {isTrial && <span className="text-cta ml-2">· 15 dias de trial</span>}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!selectedBusiness || createAddon.isPending}>
                {createAddon.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Activar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Add-ons List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum add-on activo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {addons.map((addon: any) => {
            const status = getAddonStatus(addon);
            return (
              <div key={addon.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-cta" />
                  <div>
                    <p className="text-sm font-medium">{addon.businesses?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {addon.businesses?.city} · {addon.is_trial ? "Trial 15 dias" : `${addon.duration_months} ${addon.duration_months === 1 ? "mês" : "meses"}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {status.status === "expiring" && (
                    <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {status.daysLeft}d restantes
                    </Badge>
                  )}
                  {status.status === "expired" && (
                    <Badge variant="destructive">Expirado</Badge>
                  )}
                  {status.status === "active" && (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Activo · {status.expiresAt && format(status.expiresAt, "dd/MM/yyyy")}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDeactivate(addon.id)}>
                    <Power className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessAddonsManager;
