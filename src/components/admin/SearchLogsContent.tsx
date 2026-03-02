import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  MapPin,
  Calendar,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchOverview {
  total_searches: number;
  no_result_searches: number;
  percent_no_results: number;
  emergency_searches: number;
  quote_searches: number;
  info_searches: number;
  purchase_searches: number;
}

interface TopTerm {
  input_text: string;
  frequency: number;
}

interface NoResultOpportunity {
  input_text: string;
  frequency: number;
  last_searched: string;
}

interface SearchInsight {
  search_term: string;
  total_searches: number;
  searches_without_results: number;
}

interface SearchByCity {
  user_city: string;
  total_searches: number;
}

interface SearchPerDay {
  search_day: string;
  total_searches: number;
}

type TabKey = "overview" | "zeros" | "top" | "city" | "day";

const SearchLogsContent = () => {
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: overview } = useQuery({
    queryKey: ["search-overview"],
    queryFn: async () => {
      const { data } = await supabase.from("view_search_overview" as any).select("*").single();
      return (data as unknown as SearchOverview) ?? null;
    },
    staleTime: 60_000,
  });

  const { data: zeros = [], isPending: zerosLoading } = useQuery({
    queryKey: ["search-zeros"],
    queryFn: async () => {
      const { data } = await supabase
        .from("view_no_result_opportunities" as any)
        .select("input_text, frequency, last_searched")
        .order("frequency", { ascending: false })
        .limit(200);
      return (data as unknown as NoResultOpportunity[]) ?? [];
    },
    staleTime: 60_000,
  });

  const { data: topTerms = [], isPending: topLoading } = useQuery({
    queryKey: ["search-top-terms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("view_top_search_terms" as any)
        .select("input_text, frequency")
        .order("frequency", { ascending: false })
        .limit(200);
      return (data as unknown as TopTerm[]) ?? [];
    },
    staleTime: 60_000,
  });

  const { data: insights = [], isPending: insightsLoading } = useQuery({
    queryKey: ["search-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_insights" as any)
        .select("search_term, total_searches, searches_without_results")
        .order("total_searches", { ascending: false })
        .limit(500);
      return (data as unknown as SearchInsight[]) ?? [];
    },
    staleTime: 60_000,
  });

  const { data: byCity = [], isPending: cityLoading } = useQuery({
    queryKey: ["search-by-city"],
    queryFn: async () => {
      const { data } = await supabase
        .from("view_searches_by_city" as any)
        .select("user_city, total_searches")
        .order("total_searches", { ascending: false })
        .limit(100);
      return (data as unknown as SearchByCity[]) ?? [];
    },
    staleTime: 60_000,
  });

  const { data: perDay = [], isPending: dayLoading } = useQuery({
    queryKey: ["search-per-day"],
    queryFn: async () => {
      const { data } = await supabase
        .from("view_searches_per_day" as any)
        .select("search_day, total_searches")
        .order("search_day", { ascending: false })
        .limit(60);
      return (data as unknown as SearchPerDay[]) ?? [];
    },
    staleTime: 60_000,
  });

  // ── Filters ────────────────────────────────────────────────────────────

  const filteredZeros = zeros.filter(
    (z) => !filter || z.input_text?.toLowerCase().includes(filter.toLowerCase()),
  );
  const filteredTop = topTerms.filter(
    (t) => !filter || t.input_text?.toLowerCase().includes(filter.toLowerCase()),
  );
  const filteredInsights = insights.filter(
    (i) => !filter || i.search_term?.toLowerCase().includes(filter.toLowerCase()),
  );
  const filteredCity = byCity.filter(
    (c) => !filter || c.user_city?.toLowerCase().includes(filter.toLowerCase()),
  );

  // ── Export CSV ─────────────────────────────────────────────────────────

  const exportZerosCSV = () => {
    const csv = [
      "termo_pesquisado,total_pesquisas,ultima_pesquisa",
      ...filteredZeros.map(
        (z) =>
          `"${z.input_text}",${z.frequency},"${new Date(z.last_searched).toLocaleDateString("pt-PT")}"`,
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pededireto-zeros-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const matchRate = overview
    ? Math.round(100 - (overview.percent_no_results ?? 0))
    : null;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Visão Geral" },
    { key: "zeros", label: `Zeros (${zeros.length})` },
    { key: "top", label: "Top Termos" },
    { key: "city", label: "Por Cidade" },
    { key: "day", label: "Por Dia" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Logs de Pesquisa
        </h1>
        <p className="text-muted-foreground">
          O que os utilizadores pesquisam — e onde estão as oportunidades
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-3xl font-bold text-primary">
            {overview?.total_searches?.toLocaleString() ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total pesquisas</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-3xl font-bold text-green-600">
            {matchRate !== null ? `${matchRate}%` : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Taxa de match</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center border-2 border-red-100 dark:border-red-900">
          <p className="text-3xl font-bold text-red-500">
            {overview?.no_result_searches?.toLocaleString() ?? zeros.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Zeros a corrigir</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center border-2 border-orange-100 dark:border-orange-900">
          <p className="text-3xl font-bold text-orange-500">
            {overview?.emergency_searches?.toLocaleString() ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquisas urgentes
          </p>
        </div>
      </div>

      {/* Alert */}
      {zeros.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {zeros.length} termos sem resultados detetados
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Exporte a lista e adicione os sinónimos em falta.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 dark:border-amber-700"
            onClick={exportZerosCSV}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar zeros
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar termos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ── Tab: Visão Geral ── */}
      {activeTab === "overview" && (
        <TableWrapper loading={insightsLoading}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Termo
                </div>
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground">Pesquisas</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Sem resultado</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredInsights.map((row, i) => {
              const isZero = (row.searches_without_results ?? 0) >= row.total_searches;
              return (
                <tr key={i} className="border-t border-border hover:bg-muted/20">
                  <td className="p-4 font-medium">{row.search_term}</td>
                  <td className="p-4 text-center font-semibold">{row.total_searches}</td>
                  <td className="p-4 text-center text-muted-foreground">
                    {row.searches_without_results ?? 0}
                  </td>
                  <td className="p-4 text-center">
                    {isZero ? (
                      <Badge variant="destructive" className="text-xs">Zero resultados</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Com resultados
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredInsights.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum registo.</td></tr>
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* ── Tab: Zeros ── */}
      {activeTab === "zeros" && (
        <TableWrapper loading={zerosLoading}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-400" /> Termo sem resultado
                </div>
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground">Pesquisas</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Última pesquisa</th>
            </tr>
          </thead>
          <tbody>
            {filteredZeros.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/20">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="font-medium">{row.input_text}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="font-semibold text-red-600">{row.frequency}</span>
                </td>
                <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                  {row.last_searched ? new Date(row.last_searched).toLocaleDateString("pt-PT") : "—"}
                </td>
              </tr>
            ))}
            {filteredZeros.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">
                {filter ? "Nenhum zero para este filtro." : "Sem zeros! 🎉"}
              </td></tr>
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* ── Tab: Top Termos ── */}
      {activeTab === "top" && (
        <TableWrapper loading={topLoading}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><Eye className="h-4 w-4" /> Termo</div>
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground">Frequência</th>
            </tr>
          </thead>
          <tbody>
            {filteredTop.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/20">
                <td className="p-4 font-medium">{row.input_text}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="h-2 bg-primary/30 rounded-full"
                      style={{ width: `${Math.min(100, (row.frequency / (filteredTop[0]?.frequency || 1)) * 80)}px` }}
                    />
                    <span className="font-semibold tabular-nums">{row.frequency}</span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTop.length === 0 && (
              <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">Nenhum registo.</td></tr>
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* ── Tab: Por Cidade ── */}
      {activeTab === "city" && (
        <TableWrapper loading={cityLoading}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Cidade</div>
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground">Pesquisas</th>
            </tr>
          </thead>
          <tbody>
            {filteredCity.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/20">
                <td className="p-4 font-medium">{row.user_city || "(sem cidade)"}</td>
                <td className="p-4 text-center font-semibold">{row.total_searches}</td>
              </tr>
            ))}
            {filteredCity.length === 0 && (
              <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">Nenhum registo.</td></tr>
            )}
          </tbody>
        </TableWrapper>
      )}

      {/* ── Tab: Por Dia ── */}
      {activeTab === "day" && (
        <TableWrapper loading={dayLoading}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Dia</div>
              </th>
              <th className="text-center p-4 font-medium text-muted-foreground">Pesquisas</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Barra</th>
            </tr>
          </thead>
          <tbody>
            {perDay.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/20">
                <td className="p-4 font-medium">
                  {new Date(row.search_day).toLocaleDateString("pt-PT")}
                </td>
                <td className="p-4 text-center font-semibold">{row.total_searches}</td>
                <td className="p-4 hidden md:table-cell">
                  <div
                    className="h-3 bg-primary/20 rounded-full"
                    style={{ width: `${Math.min(200, (row.total_searches / (perDay[0]?.total_searches || 1)) * 160)}px` }}
                  />
                </td>
              </tr>
            ))}
            {perDay.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhum registo.</td></tr>
            )}
          </tbody>
        </TableWrapper>
      )}

      <p className="text-sm text-muted-foreground text-right">
        {activeTab === "overview" && `${filteredInsights.length} termos`}
        {activeTab === "zeros" && `${filteredZeros.length} oportunidades`}
        {activeTab === "top" && `${filteredTop.length} termos`}
        {activeTab === "city" && `${filteredCity.length} cidades`}
        {activeTab === "day" && `${perDay.length} dias`}
      </p>
    </div>
  );
};

// ── Table wrapper ────────────────────────────────────────────────────────────

function TableWrapper({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <table className="w-full">{children}</table>
    </div>
  );
}

export default SearchLogsContent;
