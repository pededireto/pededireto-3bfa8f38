// ============================================================
// BusinessProWidgets.tsx
// Novos widgets para o dashboard PRO do Pede Direto
// Importar individualmente conforme necessário
// ============================================================

import { Star, Heart, CheckCircle, Clock, AlertCircle, Trophy, TrendingUp, TrendingDown, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import type { ProfileScoreData, ServiceRequestsData, ReviewsData, BadgeData, MonthlyHistoryItem, BenchmarkingData } from "@/hooks/useBusinessDashboardPro";


// ─── 1. CARD DE FAVORITOS ────────────────────────────────────────────────────
export const FavoritesCard = ({ count }: { count: number }) => (
  <Card className="border-border/50">
    <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
      <Heart className="h-6 w-6 text-rose-500" />
      <p className="text-xs text-muted-foreground">Guardado como Favorito</p>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">
        {count === 0 ? "Ainda ninguém guardou o teu negócio" : count === 1 ? "pessoa guardou o teu negócio" : "pessoas guardaram o teu negócio"}
      </p>
    </CardContent>
  </Card>
);


// ─── 2. SCORE DO PERFIL ──────────────────────────────────────────────────────
export const ProfileScoreCard = ({ data }: { data: ProfileScoreData }) => {
  const unfilledFields = (data.fields ?? []).filter((f) => !f.filled);
  const color = data.score >= 80 ? "text-green-500" : data.score >= 50 ? "text-amber-500" : "text-red-500";
  const bgColor = data.score >= 80 ? "bg-green-500" : data.score >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Qualidade do Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={data.score >= 80 ? "#22c55e" : data.score >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="6"
                strokeDasharray={`${(data.score / 100) * 175.9} 175.9`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-sm font-bold ${color}`}>{data.score}%</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {data.score === 100 ? "Perfil Completo! 🎉" : data.score >= 80 ? "Muito Bom!" : data.score >= 50 ? "A melhorar..." : "Precisa de atenção"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unfilledFields.length === 0 ? "Todos os campos preenchidos" : `${unfilledFields.length} campo${unfilledFields.length > 1 ? "s" : ""} por preencher`}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-muted rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${bgColor}`} style={{ width: `${data.score}%` }} />
        </div>

        {/* Sugestões de melhoria */}
        {unfilledFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sugestões para melhorar:</p>
            {unfilledFields.slice(0, 3).map((f) => (
              <div key={f.label} className="flex items-start gap-2 text-xs bg-muted/40 rounded-lg p-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{f.label}</span>
                  <span className="text-muted-foreground"> — {f.tip}</span>
                  <span className="text-primary ml-1">(+{f.points}pts)</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campos preenchidos */}
        <div className="grid grid-cols-2 gap-1.5">
          {(data.fields ?? []).map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 text-xs">
              <CheckCircle className={`h-3 w-3 flex-shrink-0 ${f.filled ? "text-green-500" : "text-muted-foreground/30"}`} />
              <span className={f.filled ? "text-foreground" : "text-muted-foreground/50"}>{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


// ─── 3. PEDIDOS DE SERVIÇO ───────────────────────────────────────────────────
export const ServiceRequestsCard = ({ data }: { data: ServiceRequestsData }) => {
  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-600" },
    enviado: { label: "Enviado", color: "bg-blue-500/10 text-blue-600" },
    accepted: { label: "Aceite", color: "bg-green-500/10 text-green-600" },
    rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-600" },
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: data.total, color: "text-foreground" },
            { label: "Pendentes", value: data.pending, color: "text-amber-500" },
            { label: "Aceites", value: data.accepted, color: "text-green-500" },
            { label: "Taxa Aceitação", value: `${data.acceptance_rate}%`, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tempo médio de resposta */}
        {data.avg_response_hours !== null && (
          <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg p-3">
            <Clock className="h-4 w-4 text-primary" />
            <span>Tempo médio de resposta: <strong>{data.avg_response_hours}h</strong></span>
          </div>
        )}

        {/* Lista recente */}
        {data.recent.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Pedidos recentes:</p>
            {data.recent.map((r) => {
              const s = statusLabel[r.status] ?? { label: r.status, color: "bg-muted text-muted-foreground" };
              return (
                <div key={r.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.description}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {r.location_city && `${r.location_city} · `}
                      {r.urgency === "urgent" ? "🔴 Urgente" : "Normal"}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Ainda não recebeste pedidos de serviço</p>
        )}
      </CardContent>
    </Card>
  );
};


// ─── 4. AVALIAÇÕES ───────────────────────────────────────────────────────────
export const ReviewsCard = ({ data }: { data: ReviewsData }) => {
  const bars = [
    { stars: 5, count: data.rating_5 },
    { stars: 4, count: data.rating_4 },
    { stars: 3, count: data.rating_3 },
    { stars: 2, count: data.rating_2 },
    { stars: 1, count: data.rating_1 },
  ];
  const maxCount = Math.max(...bars.map((b) => b.count), 1);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avaliações</CardTitle>
          {data.pending_response > 0 && (
            <Badge variant="destructive" className="text-xs">
              {data.pending_response} por responder
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Ainda sem avaliações</p>
        ) : (
          <>
            {/* Rating geral */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold">{Number(data.average_rating).toFixed(1)}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(data.average_rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{data.total} avaliações</p>
              </div>
              {/* Distribuição */}
              <div className="flex-1 space-y-1">
                {bars.map((b) => (
                  <div key={b.stars} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right text-muted-foreground">{b.stars}</span>
                    <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-amber-400"
                        style={{ width: `${(b.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 text-muted-foreground">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews recentes */}
            {data.recent.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recentes:</p>
                {data.recent.map((r) => (
                  <div key={r.id} className={`p-3 rounded-lg text-xs space-y-1 ${r.pending_response ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                      {r.pending_response && (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Sem resposta
                        </span>
                      )}
                    </div>
                    {r.comment && <p className="text-muted-foreground line-clamp-2">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};


// ─── 5. BADGES / CONQUISTAS ──────────────────────────────────────────────────
export const BadgesCard = ({ badges }: { badges: BadgeData[] }) => (
  <Card className="border-border/50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">Conquistas</CardTitle>
    </CardHeader>
    <CardContent>
      {badges.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <Award className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Ainda sem conquistas</p>
          <p className="text-xs text-muted-foreground">Completa o perfil e recebe pedidos para desbloquear badges</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.name}
              className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/40 space-y-1"
              style={{ borderTop: `3px solid ${b.color ?? "hsl(var(--primary))"}` }}
            >
              {b.icon_url ? (
                <img src={b.icon_url} alt={b.name} className="h-8 w-8 object-contain" />
              ) : (
                <Trophy className="h-8 w-8" style={{ color: b.color ?? "hsl(var(--primary))" }} />
              )}
              <p className="text-xs font-semibold">{b.name}</p>
              {b.description && <p className="text-[10px] text-muted-foreground">{b.description}</p>}
              {b.earned_at && new Date(b.earned_at).getFullYear() > 1970 && (
                <p className="text-[10px] text-muted-foreground/60">
                  {new Date(b.earned_at).toLocaleDateString("pt-PT")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);


// ─── 6. HISTÓRICO MENSAL ─────────────────────────────────────────────────────
export const MonthlyHistoryCard = ({ data }: { data: MonthlyHistoryItem[] }) => {
  const chartData = data.map((d) => ({
    mes: d.mes.slice(0, 7),
    Visualizações: d.visualizacoes,
    Cliques: d.cliques,
  }));

  const handleExport = () => {
    const rows = [
      ["Mês", "Visualizações", "Cliques", "CTR (%)"],
      ...data.map((d) => [d.mes, String(d.visualizacoes), String(d.cliques), String(d.ctr_percent ?? 0)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-mensal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">Histórico Mensal (12 meses)</CardTitle>
        {data.length > 0 && (
          <button onClick={handleExport} className="text-xs text-primary hover:underline flex items-center gap-1">
            Exportar CSV
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados históricos ainda</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="Visualizações" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cliques" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-1.5 text-muted-foreground font-medium">Mês</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">Views</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">Cliques</th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map((d) => (
                    <tr key={d.mes} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="py-1.5">{d.mes}</td>
                      <td className="text-right py-1.5">{d.visualizacoes}</td>
                      <td className="text-right py-1.5">{d.cliques}</td>
                      <td className="text-right py-1.5">{d.ctr_percent !== null ? `${d.ctr_percent}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};


// ─── 7. BENCHMARKING PRO ─────────────────────────────────────────────────────
export const BenchmarkingProCard = ({ data }: { data: BenchmarkingData }) => {
  const getRankIcon = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return `#${pos}`;
  };

  const vsMedia = data.views_this_month - data.media_views_categoria;
  const isAboveMedia = vsMedia >= 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Benchmarking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.total_negocios_categoria === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ainda sem dados suficientes na categoria para comparar
          </p>
        ) : (
          <>
            {/* Posições */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold">{data.posicao_geral > 0 ? getRankIcon(data.posicao_geral) : "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Na categoria</p>
                <p className="text-[10px] text-muted-foreground/60">{data.total_negocios_categoria} negócios</p>
              </div>
              <div className="bg-muted/40 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold">{data.posicao_cidade > 0 ? getRankIcon(data.posicao_cidade) : "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Na cidade</p>
              </div>
            </div>

            {/* Comparação com média */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${isAboveMedia ? "bg-green-500/10" : "bg-amber-500/10"}`}>
              {isAboveMedia
                ? <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                : <TrendingDown className="h-5 w-5 text-amber-500 flex-shrink-0" />
              }
              <div className="text-sm">
                <p className="font-medium">
                  {isAboveMedia
                    ? `${vsMedia} views acima da média`
                    : `${Math.abs(vsMedia)} views abaixo da média`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Média da categoria: {data.media_views_categoria} views/mês
                </p>
              </div>
            </div>

            {/* Métricas comparativas */}
            <div className="space-y-2">
              {[
                { label: "Views este mês", mine: data.views_this_month, media: data.media_views_categoria },
                { label: "Leads este mês", mine: 0, media: data.media_leads_categoria },
                { label: "CTR médio", mine: 0, media: data.media_ctr_categoria, suffix: "%" },
              ].map((row) => (
                <div key={row.label} className="text-xs">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">Média: {row.media}{row.suffix ?? ""}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min((row.mine / Math.max(row.media * 2, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dica acionável */}
            <div className="text-xs bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="font-medium">💡 Dica</p>
              <p className="text-muted-foreground">
                {data.posicao_geral === 1
                  ? "Estás no topo! Mantém o perfil atualizado para conservar a liderança."
                  : data.posicao_geral <= 3
                  ? "Estás no top 3! Adiciona mais fotos e responde a avaliações para subir."
                  : "Completa o perfil a 100% e pede avaliações a clientes para subir no ranking."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
