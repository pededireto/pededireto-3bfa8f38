import { useState } from "react";
import { useAllBusinesses } from "@/hooks/useBusinesses";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { useBusinessBenchmark } from "@/hooks/useBusinessBenchmark";
import { useBusinessAlerts } from "@/hooks/useBusinessAlerts";
import { useCommercialPlans } from "@/hooks/useCommercialPlans";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BusinessProfileScore from "@/components/business/BusinessProfileScore";
import {
  Search,
  Building2,
  Eye,
  MousePointerClick,
  TrendingUp,
  ChevronRight,
  X,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  CalendarPlus,
  StickyNote,
  AlertTriangle,
  Star,
  MapPin,
  CreditCard,
  Loader2,
  BarChart3,
} from "lucide-react";

// ─── Ficha de cliente ────────────────────────────────────────────────────────

const BusinessFicha = ({ business, onClose }: { business: any; onClose: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: analytics } = useBusinessAnalytics(business.id, 30);
  const { data: benchmark } = useBusinessBenchmark(business.id, 30);
  const { data: alerts = [] } = useBusinessAlerts(business.id, business);
  const { data: plans = [] } = useCommercialPlans(true);

  const [extendDays, setExtendDays] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [extendingDays, setExtendingDays] = useState(false);

  const plan = plans.find((p: any) => p.id === business.plan_id);
  const contactsPerVisit =
    analytics && analytics.views > 0 ? (analytics.totalContacts / analytics.views).toFixed(1) : "—";

  const handleToggleActive = async () => {
    setTogglingActive(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ is_active: !business.is_active })
        .eq("id", business.id);
      if (error) throw error;

      await (supabase as any).from("cs_actions").insert({
        business_id: business.id,
        action_type: business.is_active ? "deactivate" : "activate",
        notes: `Negócio ${business.is_active ? "desactivado" : "activado"} pela equipa CS`,
      });

      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast({ title: business.is_active ? "Negócio desactivado" : "Negócio activado ✅" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setTogglingActive(false);
    }
  };

  const handleExtendDays = async () => {
    const days = parseInt(extendDays);
    if (!days || days <= 0) return;
    setExtendingDays(true);
    try {
      const currentEnd = business.subscription_end_date ? new Date(business.subscription_end_date) : new Date();
      currentEnd.setDate(currentEnd.getDate() + days);

      const { error } = await supabase
        .from("businesses")
        .update({ subscription_end_date: currentEnd.toISOString().split("T")[0] })
        .eq("id", business.id);
      if (error) throw error;

      await (supabase as any).from("cs_actions").insert({
        business_id: business.id,
        action_type: "extend_subscription",
        notes: `Subscrição estendida ${days} dias pela equipa CS`,
      });

      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      toast({ title: `✅ Subscrição estendida ${days} dias` });
      setExtendDays("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setExtendingDays(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await (supabase as any).from("cs_actions").insert({
        business_id: business.id,
        action_type: "note",
        notes: note.trim(),
      });
      toast({ title: "✅ Nota guardada" });
      setNote("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  const severityStyles: Record<string, string> = {
    warning: "border-yellow-500/30 bg-yellow-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
    success: "border-green-500/30 bg-green-500/5",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-end p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt=""
                className="h-12 w-12 rounded-lg object-contain border border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {business.name[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{business.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {business.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {business.city}
                  </span>
                )}
                <Badge variant={business.is_active ? "default" : "secondary"} className="text-xs">
                  {business.is_active ? "✅ Activo" : "⚠️ Inactivo"}
                </Badge>
                <Badge
                  variant={business.subscription_status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {plan?.name || "Gratuito"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={`/negocio/${business.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver página
              </a>
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Alertas activos */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Alertas do cliente
              </p>
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-xs ${severityStyles[alert.severity]}`}
                >
                  <span className="font-semibold text-foreground">{alert.title}</span>
                  <span className="text-muted-foreground ml-1">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Score de perfil */}
          <BusinessProfileScore
            businessId={business.id}
            canViewPro={true}
            onInsightsClick={() => {}}
            onUpgradeClick={() => {}}
          />

          {/* Métricas PRO */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Métricas (30 dias)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Visualizações</span>
                </div>
                <p className="text-2xl font-bold">{analytics?.views ?? "—"}</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Contactos</span>
                </div>
                <p className="text-2xl font-bold">{analytics?.totalContacts ?? "—"}</p>
                {analytics && analytics.totalContacts > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {analytics.breakdown.phone > 0 && (
                      <span className="text-[10px] text-muted-foreground">📞{analytics.breakdown.phone}</span>
                    )}
                    {analytics.breakdown.whatsapp > 0 && (
                      <span className="text-[10px] text-muted-foreground">💬{analytics.breakdown.whatsapp}</span>
                    )}
                    {analytics.breakdown.website > 0 && (
                      <span className="text-[10px] text-muted-foreground">🌐{analytics.breakdown.website}</span>
                    )}
                    {analytics.breakdown.email > 0 && (
                      <span className="text-[10px] text-muted-foreground">✉️{analytics.breakdown.email}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-muted/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Contactos/Visita</span>
                </div>
                <p className="text-2xl font-bold">{contactsPerVisit}</p>
                <p className="text-[10px] text-muted-foreground mt-1">média plataforma ~0.3</p>
              </div>
            </div>
          </div>

          {/* Benchmarking */}
          {benchmark && benchmark.category_stats?.name && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                <Star className="h-3 w-3" /> Benchmarking
              </p>
              <div className="grid grid-cols-2 gap-3">
                {benchmark.subcategory_stats?.name && (
                  <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{benchmark.subcategory_stats.name}</p>
                    <p className="text-xl font-bold text-primary mt-1">
                      {benchmark.subcategory_stats.avg_views ?? "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">média de views na subcategoria</p>
                  </div>
                )}
                {benchmark.city_stats?.city && (
                  <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{benchmark.city_stats.city}</p>
                    <p className="text-xl font-bold text-primary mt-1">{benchmark.city_stats.avg_views ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">média de views na cidade</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscrição */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Subscrição
            </p>
            <div className="bg-muted/40 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Plano</span>
                {plan?.name || "Gratuito"}
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Estado</span>
                <Badge
                  variant={business.subscription_status === "active" ? "default" : "secondary"}
                  className="text-xs mt-0.5"
                >
                  {business.subscription_status === "active"
                    ? "Activo"
                    : business.subscription_status === "expired"
                      ? "Expirado"
                      : "Inactivo"}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Início</span>
                {business.subscription_start_date || "—"}
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Fim</span>
                {business.subscription_end_date || "—"}
              </div>
            </div>
          </div>

          {/* Acções CS */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acções CS</p>

            {/* Toggle activo */}
            <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium">{business.is_active ? "Negócio visível" : "Negócio oculto"}</p>
                <p className="text-xs text-muted-foreground">
                  {business.is_active ? "Clica para desactivar" : "Clica para activar"}
                </p>
              </div>
              <Button
                size="sm"
                variant={business.is_active ? "destructive" : "default"}
                onClick={handleToggleActive}
                disabled={togglingActive}
              >
                {togglingActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : business.is_active ? (
                  <ToggleRight className="h-4 w-4 mr-1" />
                ) : (
                  <ToggleLeft className="h-4 w-4 mr-1" />
                )}
                {business.is_active ? "Desactivar" : "Activar"}
              </Button>
            </div>

            {/* Estender subscrição */}
            <div className="bg-muted/40 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Estender subscrição</p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Nº de dias"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="flex-1"
                  min="1"
                />
                <Button size="sm" onClick={handleExtendDays} disabled={!extendDays || extendingDays}>
                  {extendingDays ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </Button>
              </div>
            </div>

            {/* Nota interna */}
            <div className="bg-muted/40 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Adicionar nota interna</p>
              </div>
              <Textarea
                placeholder="Nota visível apenas pela equipa CS..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button size="sm" onClick={handleSaveNote} disabled={!note.trim() || savingNote} className="w-full">
                {savingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <StickyNote className="h-4 w-4 mr-2" />
                )}
                Guardar nota
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Lista de negócios ────────────────────────────────────────────────────────

const CsBusinesses = () => {
  const [search, setSearch] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all");
  const { data: businesses = [], isLoading } = useAllBusinesses();
  const { data: plans = [] } = useCommercialPlans(true);

  const planMap = new Map(plans.map((p: any) => [p.id, p]));

  const filtered = businesses.filter((b: any) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) || b.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? b.is_active && b.subscription_status === "active"
          : filterStatus === "inactive"
            ? !b.is_active
            : b.subscription_status === "expired";
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar negócio ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive", "expired"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
              className="text-xs"
            >
              {s === "all" ? "Todos" : s === "active" ? "Activos" : s === "inactive" ? "Inactivos" : "Expirados"}
            </Button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} negócio{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum negócio encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((business: any) => {
            const plan = planMap.get(business.plan_id);
            const isFreePlan = !business.plan_id || business.plan_id === "543e0ec3-21ba-4223-bb7a-6375341349b4";
            return (
              <div
                key={business.id}
                className="bg-card rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedBusiness(business)}
              >
                <div className="flex items-center gap-4 p-4">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt=""
                      className="h-10 w-10 rounded-lg object-contain border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {business.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{business.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {business.city && <span className="text-xs text-muted-foreground">{business.city}</span>}
                      {business.categories?.name && (
                        <span className="text-xs text-muted-foreground">· {business.categories.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={business.is_active ? "default" : "secondary"} className="text-xs hidden sm:flex">
                      {business.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {!isFreePlan && (
                      <Badge variant="outline" className="text-xs hidden sm:flex border-primary/40 text-primary">
                        {plan?.name || "Pago"}
                      </Badge>
                    )}
                    {business.subscription_status === "expired" && (
                      <Badge variant="destructive" className="text-xs hidden sm:flex">
                        Expirado
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ficha de cliente */}
      {selectedBusiness && <BusinessFicha business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />}
    </div>
  );
};

export default CsBusinesses;
