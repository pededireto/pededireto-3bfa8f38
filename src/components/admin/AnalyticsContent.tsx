import { useState } from "react";
import {
  useAnalyticsSummary,
  useUserStats,
  useAnalyticsCities,
  useActiveCategories,
  useSubcategories,
  useActiveBusinessesCount,
  type AnalyticsFilters,
  type PeriodFilter,
} from "@/hooks/useAnalytics";
import { useServiceRequestStats } from "@/hooks/useServiceRequests";
import {
  Loader2,
  Eye,
  MousePointerClick,
  MessageCircle,
  Phone,
  Globe,
  Mail,
  Users,
  Inbox,
  Building2,
  Search,
  X,
} from "lucide-react";

// ─── Filtros ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Sempre" },
];

const DEFAULT_FILTERS: AnalyticsFilters = { period: "30d" };

// ─── Componente auxiliar: barra de progresso ────────────────────────────────

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-secondary/40 rounded-full h-1.5 mt-1.5">
      <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Componente principal ───────────────────────────────────────────────────

const AnalyticsContent = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [catSearch, setCatSearch] = useState("");
  const [bizSearch, setBizSearch] = useState("");
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllBiz, setShowAllBiz] = useState(false);

  const { data: analytics, isLoading } = useAnalyticsSummary(filters);
  const { data: userStats } = useUserStats();
  const { data: requestStats } = useServiceRequestStats();
  const { data: cities = [] } = useAnalyticsCities();
  const { data: categories = [] } = useActiveCategories();
  const { data: subcategories = [] } = useSubcategories(filters.categoryId);
  const { data: activeBusinesses = 0 } = useActiveBusinessesCount();

  const setFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // reset subcategoria quando categoria muda
      if (key === "categoryId") next.subcategoryId = null;
      return next;
    });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCatSearch("");
    setBizSearch("");
    setShowAllCats(false);
    setShowAllBiz(false);
  };

  const hasActiveFilters =
    filters.period !== "30d" || !!filters.categoryId || !!filters.subcategoryId || !!filters.city;

  // ── Categorias filtradas por pesquisa ──
  const allCats = analytics?.topCategories ?? [];
  const maxCatCount = allCats[0]?.count ?? 1;
  const totalCatEvents = allCats.reduce((s, c) => s + c.count, 0);
  const filteredCats = catSearch
    ? allCats.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : allCats;
  const visibleCats = showAllCats ? filteredCats : filteredCats.slice(0, 10);

  // ── Negócios filtrados por pesquisa ──
  const allBiz = analytics?.topBusinesses ?? [];
  const maxBizCount = allBiz[0]?.count ?? 1;
  const filteredBiz = bizSearch ? allBiz.filter((b) => b.name.toLowerCase().includes(bizSearch.toLowerCase())) : allBiz;
  const visibleBiz = showAllBiz ? filteredBiz : filteredBiz.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Estatísticas de utilização da plataforma</p>
      </div>

      {/* ── Barra de Filtros ── */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Período */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs text-muted-foreground font-medium">Período</label>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.period}
              onChange={(e) => setFilter("period", e.target.value as PeriodFilter)}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground font-medium">Categoria</label>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.categoryId ?? ""}
              onChange={(e) => setFilter("categoryId", e.target.value || null)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoria — só aparece quando categoria está seleccionada */}
          {filters.categoryId && (
            <div className="flex flex-col gap-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground font-medium">Subcategoria</label>
              <select
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.subcategoryId ?? ""}
                onChange={(e) => setFilter("subcategoryId", e.target.value || null)}
              >
                <option value="">Todas as subcategorias</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cidade */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs text-muted-foreground font-medium">Cidade</label>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.city ?? ""}
              onChange={(e) => setFilter("city", e.target.value || null)}
            >
              <option value="">Todas as cidades</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Limpar */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-border transition-colors mt-auto"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Cards de Visão Geral ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !analytics ? (
        <div className="text-center py-16 text-muted-foreground">Não foi possível carregar os analytics.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Views */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString("pt-PT")}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Total Cliques */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cliques</p>
                  <p className="text-3xl font-bold">{analytics.totalClicks.toLocaleString("pt-PT")}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-accent" />
                </div>
              </div>
            </div>

            {/* Taxa Conversão */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                  <p className="text-3xl font-bold">
                    {analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-success" />
                </div>
              </div>
            </div>

            {/* Negócios Activos */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Negócios Activos</p>
                  <p className="text-3xl font-bold">{activeBusinesses.toLocaleString("pt-PT")}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Cliques por Tipo ── */}
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Cliques por Tipo de Contacto</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <MessageCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{analytics.clicksBreakdown.whatsapp}</p>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{analytics.clicksBreakdown.phone}</p>
                <p className="text-sm text-muted-foreground">Telefone</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-500/10">
                <Globe className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{analytics.clicksBreakdown.website}</p>
                <p className="text-sm text-muted-foreground">Website</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-500/10">
                <Mail className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{analytics.clicksBreakdown.email}</p>
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-pink-500/10">
                <Globe className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{analytics.clicksBreakdown.app}</p>
                <p className="text-sm text-muted-foreground">App</p>
              </div>
            </div>
          </div>

          {/* ── Utilizadores & Pedidos ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Utilizadores</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userStats?.newThisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Novos este mês</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userStats?.activeLast30 || 0}</p>
                  <p className="text-sm text-muted-foreground">Ativos 30d</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pedidos (Leads)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{requestStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{requestStats?.thisMonth || 0}</p>
                  <p className="text-sm text-muted-foreground">Este mês</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{requestStats?.forwardRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Encaminhamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{requestStats?.conclusionRate || 0}%</p>
                  <p className="text-sm text-muted-foreground">Conclusão</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Top Categorias & Negócios ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categorias */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Categorias Mais Populares</h2>

              {/* Pesquisa */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar categoria..."
                  value={catSearch}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowAllCats(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                {visibleCats.map((cat, index) => {
                  const pct = totalCatEvents > 0 ? ((cat.count / totalCatEvents) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={index} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{cat.count} eventos</span>
                          <span className="text-xs text-muted-foreground ml-2">({pct}%)</span>
                        </div>
                      </div>
                      <ProgressBar value={cat.count} max={maxCatCount} />
                    </div>
                  );
                })}
                {filteredCats.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {catSearch ? "Nenhuma categoria encontrada." : "Sem dados suficientes ainda."}
                  </p>
                )}
              </div>

              {filteredCats.length > 10 && (
                <button
                  onClick={() => setShowAllCats((v) => !v)}
                  className="mt-4 w-full text-sm text-primary hover:underline"
                >
                  {showAllCats ? "Ver menos" : `Ver mais (${filteredCats.length - 10} restantes)`}
                </button>
              )}
            </div>

            {/* Top Negócios */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4">Negócios Mais Clicados</h2>

              {/* Pesquisa */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar negócio..."
                  value={bizSearch}
                  onChange={(e) => {
                    setBizSearch(e.target.value);
                    setShowAllBiz(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                {visibleBiz.map((biz, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{biz.name}</span>
                        {biz.city && <p className="text-xs text-muted-foreground mt-0.5">{biz.city}</p>}
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">{biz.count} cliques</span>
                    </div>
                    <ProgressBar value={biz.count} max={maxBizCount} />
                  </div>
                ))}
                {filteredBiz.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {bizSearch ? "Nenhum negócio encontrado." : "Sem dados suficientes ainda."}
                  </p>
                )}
              </div>

              {filteredBiz.length > 10 && (
                <button
                  onClick={() => setShowAllBiz((v) => !v)}
                  className="mt-4 w-full text-sm text-primary hover:underline"
                >
                  {showAllBiz ? "Ver menos" : `Ver mais (${filteredBiz.length - 10} restantes)`}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsContent;
