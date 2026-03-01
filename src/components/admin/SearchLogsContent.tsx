import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, TrendingUp, AlertCircle, CheckCircle2, Download, Eye } from "lucide-react";

// ── Tipos baseados nas views reais da BD ─────────────────────────────────────
interface SearchOverview {
  total_searches: number;
  no_result_searches: number;
  percent_no_results: number;
  emergency_searches: number;
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

const SearchLogsContent = () => {
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "zeros" | "top">("overview");

  // ── KPIs via view_search_overview ────────────────────────────────────────
  const { data: overview } = useQuery({
    queryKey: ["search-overview"],
    queryFn: async (): Promise<SearchOverview | null> => {
      const { data } = await supabase.from("view_search_overview").select("*").single();
      return data ?? null;
    },
    staleTime: 60_000,
  });

  // ── Zeros via view_no_result_opportunities ────────────────────────────────
  const { data: zeros = [], isLoading: zerosLoading } = useQuery({
    queryKey: ["search-zeros"],
    queryFn: async (): Promise<NoResultOpportunity[]> => {
      const { data } = await supabase
        .from("view_no_result_opportunities")
        .select("input_text, frequency, last_searched")
        .order("frequency", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // ── Top termos via view_top_search_terms ──────────────────────────────────
  const { data: topTerms = [], isLoading: topLoading } = useQuery({
    queryKey: ["search-top-terms"],
    queryFn: async (): Promise<TopTerm[]> => {
      const { data } = await supabase
        .from("view_top_search_terms")
        .select("input_text, frequency")
        .order("frequency", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // ── search_insights (termo + zeros) ──────────────────────────────────────
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["search-insights"],
    queryFn: async (): Promise<SearchInsight[]> => {
      const { data } = await supabase
        .from("search_insights")
        .select("search_term, total_searches, searches_without_results")
        .order("total_searches", { ascending: false })
        .limit(500);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // ── Filtros ──────────────────────────────────────────────────────────────
  const filteredZeros = zeros.filter((z) => !filter || z.input_text?.toLowerCase().includes(filter.toLowerCase()));
  const filteredTop = topTerms.filter((t) => !filter || t.input_text?.toLowerCase().includes(filter.toLowerCase()));
  const filteredInsights = insights.filter(
    (i) => !filter || i.search_term?.toLowerCase().includes(filter.toLowerCase()),
  );

  // ── Export CSV dos zeros ─────────────────────────────────────────────────
  const exportZerosCSV = () => {
    const csv = [
      "termo_pesquisado,total_pesquisas,ultima_pesquisa",
      ...filteredZeros.map(
        (z) => `"${z.input_text}",${z.frequency},"${new Date(z.last_searched).toLocaleDateString("pt-PT")}"`,
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

  const matchRate = overview ? Math.round(100 - (overview.percent_no_results ?? 0)) : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Logs de Pesquisa</h1>
        <p className="text-muted-foreground">
          O que os utilizadores pesquisam — e onde estão as oportunidades de melhoria
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-3xl font-bold text-primary">{overview?.total_searches?.toLocaleString() ?? "—"}</p>
          <p className="text-sm text-muted-foreground mt-1">Total pesquisas</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <p className="text-3xl font-bold text-green-600">{matchRate !== null ? `${matchRate}%` : "—"}</p>
          <p className="text-sm text-muted-foreground mt-1">Taxa de match</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center border-2 border-red-100">
          <p className="text-3xl font-bold text-red-500">
            {overview?.no_result_searches?.toLocaleString() ?? zeros.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Zeros a corrigir</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center border-2 border-orange-100">
          <p className="text-3xl font-bold text-orange-500">{overview?.emergency_searches?.toLocaleString() ?? "—"}</p>
          <p className="text-sm text-muted-foreground mt-1">Pesquisas urgentes</p>
        </div>
      </div>

      {/* ── Alerta de zeros ── */}
      {zeros.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">{zeros.length} termos sem resultados detetados</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Exporte a lista e adicione os sinónimos em falta para capturar mais tráfego.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={exportZerosCSV}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar zeros
          </Button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "overview", label: "Visão Geral" },
          { key: "zeros", label: `Zeros (${zeros.length})` },
          { key: "top", label: "Top Termos" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filtro ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar termos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ── Tab: Visão Geral (search_insights) ── */}
      {activeTab === "overview" && (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {insightsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
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
                      <td className="p-4 text-center text-muted-foreground">{row.searches_without_results ?? 0}</td>
                      <td className="p-4 text-center">
                        {isZero ? (
                          <Badge variant="destructive" className="text-xs">
                            Zero resultados
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Com resultados
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredInsights.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Nenhum registo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab: Zeros ── */}
      {activeTab === "zeros" && (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {zerosLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-400" /> Termo sem resultado
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Pesquisas</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                    Última pesquisa
                  </th>
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
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                      {filter ? "Nenhum zero encontrado para este filtro." : "Sem zeros registados! 🎉"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab: Top Termos ── */}
      {activeTab === "top" && (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {topLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" /> Termo mais pesquisado
                    </div>
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
                          style={{
                            width: `${Math.min(100, (row.frequency / (filteredTop[0]?.frequency || 1)) * 80)}px`,
                          }}
                        />
                        <span className="font-semibold tabular-nums">{row.frequency}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTop.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                      Nenhum registo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground text-right">
        {activeTab === "overview" && `${filteredInsights.length} termos`}
        {activeTab === "zeros" && `${filteredZeros.length} oportunidades`}
        {activeTab === "top" && `${filteredTop.length} termos`}
      </p>
    </div>
  );
};

export default SearchLogsContent;
