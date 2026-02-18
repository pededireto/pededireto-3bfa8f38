import { BarChart3, Send, Eye, MousePointer, Reply, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEmailPerformance, useCadencePerformance, useEmailLogs } from "@/hooks/useEmailMarketing";

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const EmailAnalyticsContent = () => {
  const { data: performance = [] } = useEmailPerformance();
  const { data: cadencePerf = [] } = useCadencePerformance();
  const { data: recentLogs = [] } = useEmailLogs({ limit: 20 });

  // Aggregate stats
  const totalSent = performance.reduce((sum: number, p: any) => sum + (p.total_sent || 0), 0);
  const totalOpened = performance.reduce((sum: number, p: any) => sum + (p.total_opened || 0), 0);
  const totalClicked = performance.reduce((sum: number, p: any) => sum + (p.total_clicked || 0), 0);
  const totalReplied = performance.reduce((sum: number, p: any) => sum + (p.total_replied || 0), 0);
  const totalBounced = performance.reduce((sum: number, p: any) => sum + (p.total_bounced || 0), 0);

  // Also count individual sends (no campaign)
  const individualSends = recentLogs.filter((l: any) => !l.campaign_id).length;

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics de Email</h2>
        <p className="text-muted-foreground">Performance geral das campanhas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Send} label="Enviados" value={totalSent + individualSends} />
        <StatCard icon={Eye} label="Abertos" value={totalOpened} sub={`${openRate}%`} />
        <StatCard icon={MousePointer} label="Clicados" value={totalClicked} sub={`${clickRate}%`} />
        <StatCard icon={Reply} label="Respondidos" value={totalReplied} />
        <StatCard icon={AlertTriangle} label="Bounced" value={totalBounced} />
        <StatCard icon={BarChart3} label="Individuais" value={individualSends} />
      </div>

      {/* Campaign Performance */}
      {performance.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Performance por Campanha</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{p.campaign_name || "Sem campanha"}</p>
                    <p className="text-sm text-muted-foreground">{p.total_sent} enviados</p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <Badge variant="outline">Open: {p.open_rate}%</Badge>
                    <Badge variant="outline">Click: {p.click_rate}%</Badge>
                    <Badge variant="outline">Reply: {p.reply_rate}%</Badge>
                    {p.bounce_rate > 0 && <Badge variant="destructive">Bounce: {p.bounce_rate}%</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cadence Performance */}
      {cadencePerf.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Performance por Cadence</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cadencePerf.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{c.cadence_name}</p>
                    <p className="text-sm text-muted-foreground">{c.total_enrolled} inscritos</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="default">{c.active_count} ativos</Badge>
                    <Badge variant="outline">{c.completed_count} completos</Badge>
                    {c.paused_count > 0 && <Badge variant="secondary">{c.paused_count} pausados</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Atividade Recente</CardTitle></CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem atividade recente.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between text-sm p-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground truncate block">{log.recipient_email}</span>
                    <span className="text-xs text-muted-foreground">{log.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.opened_at && <Eye className="w-3 h-3 text-primary" />}
                    {log.clicked_at && <MousePointer className="w-3 h-3 text-accent-foreground" />}
                    {log.replied_at && <Reply className="w-3 h-3 text-secondary-foreground" />}
                    {log.bounced && <AlertTriangle className="w-3 h-3 text-destructive" />}
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.sent_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAnalyticsContent;
