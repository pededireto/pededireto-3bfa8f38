import { useMyCommissions, useMyAssignments, usePerformanceRanking } from "@/hooks/useCommercialPerformance";
import { useMyPipeline, PIPELINE_PHASES } from "@/hooks/useCommercialPipeline";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, DollarSign, CheckCircle, Target, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CommercialDashboardContent = () => {
  const { data: commissions = [], isLoading: cLoading } = useMyCommissions();
  const { data: assignments = [], isLoading: aLoading } = useMyAssignments();
  const { data: pipeline = [], isLoading: pLoading } = useMyPipeline();
  const { data: ranking = [], isLoading: rLoading } = usePerformanceRanking();

  if (cLoading || aLoading || pLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalConversions = assignments.length;
  const totalRevenue = assignments.reduce((s: number, a: any) => s + (Number(a.businesses?.subscription_price) || 0), 0);
  const totalCommission = commissions.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const totalPaid = commissions.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount), 0);
  const pipelineTotal = pipeline.length;
  const proposalsSent = pipeline.filter(p => p.phase === "proposta_enviada" || p.phase === "negociacao").length;

  // Follow-up alerts
  const today = new Date().toISOString().split("T")[0];
  const overdueFollowups = pipeline.filter(p => p.next_followup_date && p.next_followup_date <= today);
  const upcomingFollowups = pipeline.filter(p => {
    if (!p.next_followup_date || p.next_followup_date <= today) return false;
    const diff = (new Date(p.next_followup_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  });

  // Pipeline summary by phase
  const phaseSummary = PIPELINE_PHASES.map(phase => ({
    ...phase,
    count: pipeline.filter(p => p.phase === phase.value).length,
  })).filter(p => p.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">📊 Dashboard</h1>
        <p className="text-muted-foreground">Resumo da sua performance comercial</p>
      </div>

      {/* Follow-up Alerts */}
      {(overdueFollowups.length > 0 || upcomingFollowups.length > 0) && (
        <div className="space-y-2">
          {overdueFollowups.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-destructive text-sm">
                  {overdueFollowups.length} follow-up{overdueFollowups.length > 1 ? "s" : ""} em atraso
                </span>
              </div>
              <div className="space-y-1">
                {overdueFollowups.slice(0, 5).map(p => (
                  <p key={p.id} className="text-sm text-muted-foreground">
                    • <span className="font-medium text-foreground">{p.businesses?.name}</span>
                    {p.next_followup_date && ` — previsto ${new Date(p.next_followup_date).toLocaleDateString("pt-PT")}`}
                  </p>
                ))}
              </div>
            </div>
          )}
          {upcomingFollowups.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-warning" />
                <span className="font-semibold text-warning text-sm">
                  {upcomingFollowups.length} follow-up{upcomingFollowups.length > 1 ? "s" : ""} nos próximos 3 dias
                </span>
              </div>
              <div className="space-y-1">
                {upcomingFollowups.slice(0, 5).map(p => (
                  <p key={p.id} className="text-sm text-muted-foreground">
                    • <span className="font-medium text-foreground">{p.businesses?.name}</span>
                    {p.next_followup_date && ` — ${new Date(p.next_followup_date).toLocaleDateString("pt-PT")}`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "No Pipeline", value: pipelineTotal, icon: Target },
          { label: "Negócios Atribuídos", value: totalConversions, icon: Users },
          { label: "Propostas Ativas", value: proposalsSent, icon: TrendingUp },
          { label: "Comissão Total", value: `${totalCommission.toFixed(2)}€`, icon: DollarSign },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Summary */}
      {phaseSummary.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h2 className="font-semibold text-foreground mb-3">🎯 Pipeline por Fase</h2>
          <div className="flex flex-wrap gap-2">
            {phaseSummary.map(phase => (
              <Badge key={phase.value} variant="secondary" className={cn("text-sm px-3 py-1", phase.color)}>
                {phase.emoji} {phase.label}: {phase.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Team Ranking */}
      {!rLoading && ranking.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h2 className="font-semibold text-foreground mb-3">🏆 Ranking da Equipa</h2>
          <div className="space-y-2">
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="font-medium text-sm">{r.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{r.conversions} conversões</span>
                  <span className="font-medium text-primary">{r.revenue.toFixed(0)}€</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialDashboardContent;
