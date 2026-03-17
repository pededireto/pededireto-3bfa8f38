import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Eye, MousePointerClick, Target, MapPin, Search, TrendingUp, TrendingDown, Clock, Calendar, Phone, MessageCircle, Globe, Mail, Download, ArrowDown } from "lucide-react";
import { getVariation, getPeakHourLabel, getPeakDowLabel } from "@/hooks/useBusinessIntelligence";
import type { BusinessIntelligenceData } from "@/hooks/useBusinessIntelligence";

interface BusinessPerformanceCardProps {
  data: BusinessIntelligenceData;
}

const VariationBadge = ({ current, previous }: { current: number; previous: number }) => {
  const variation = getVariation(current, previous);
  if (previous === 0 && current === 0) return null;
  const isPositive = variation >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{variation}%
    </span>
  );
};

const CONTACT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316"];

const BusinessPerformanceCard = ({ data }: BusinessPerformanceCardProps) => {
  const totalContacts = data.contacts.click_phone + data.contacts.click_whatsapp + data.contacts.click_website + data.contacts.click_email;

  const kpis = [
    { label: "Visualizações", value: data.impressions.toLocaleString("pt-PT"), icon: Eye, current: data.impressions, previous: data.previous.impressions },
    { label: "Cliques", value: data.clicks.toLocaleString("pt-PT"), icon: MousePointerClick, current: data.clicks, previous: data.previous.clicks },
    { label: "CTR", value: `${data.ctr}%`, icon: Target, current: null, previous: null },
    { label: "Pesquisas Categoria", value: data.searches_in_category.toLocaleString("pt-PT"), icon: Search, current: null, previous: null },
    { label: "Pesquisas Cidade", value: data.searches_in_city.toLocaleString("pt-PT"), icon: MapPin, current: null, previous: null },
  ];

  const allContactTypes = [
    { name: "Telefone", value: data.contacts.click_phone, icon: "📞" },
    { name: "WhatsApp", value: data.contacts.click_whatsapp, icon: "💬" },
    { name: "Website", value: data.contacts.click_website, icon: "🌐" },
    { name: "Email", value: data.contacts.click_email, icon: "✉️" },
    { name: "Instagram", value: data.contacts.click_instagram ?? 0, icon: "📸" },
    { name: "Facebook", value: data.contacts.click_facebook ?? 0, icon: "📘" },
    { name: "Reservas", value: data.contacts.click_reservation ?? 0, icon: "📅" },
    { name: "Pedidos Online", value: data.contacts.click_order ?? 0, icon: "🛒" },
  ];

  const sortedContacts = [...allContactTypes].sort((a, b) => b.value - a.value);
  const maxContactValue = Math.max(...sortedContacts.map((c) => c.value), 1);

  const contactPieData = [
    { name: "Telefone", value: data.contacts.click_phone },
    { name: "Website", value: data.contacts.click_website },
    { name: "WhatsApp", value: data.contacts.click_whatsapp },
    { name: "Email", value: data.contacts.click_email },
  ].filter((c) => c.value > 0);

  // Funnel data
  const viewToClickRate = data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(1) : "0";
  const clickToContactRate = data.clicks > 0 ? ((totalContacts / data.clicks) * 100).toFixed(1) : "0";

  // Comparison bar chart data
  const comparisonData = [
    { name: "Visualizações", current: data.impressions, previous: data.previous.impressions },
    { name: "Cliques", current: data.clicks, previous: data.previous.clicks },
  ];

  // Export CSV
  const handleExport = () => {
    const rows = [
      ["Métrica", "Valor"],
      ["Visualizações", String(data.impressions)],
      ["Cliques", String(data.clicks)],
      ["CTR", `${data.ctr}%`],
      ["Contactos Telefone", String(data.contacts.click_phone)],
      ["Contactos WhatsApp", String(data.contacts.click_whatsapp)],
      ["Contactos Website", String(data.contacts.click_website)],
      ["Contactos Email", String(data.contacts.click_email)],
      ["Total Contactos", String(totalContacts)],
      ["Hora de Pico", getPeakHourLabel(data.peak_hour)],
      ["Dia Mais Ativo", getPeakDowLabel(data.peak_dow)],
      ["Pesquisas Categoria", String(data.searches_in_category)],
      ["Pesquisas Cidade", String(data.searches_in_city)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-semibold">{kpi.value}</p>
              {kpi.current !== null && kpi.previous !== null && (
                <div className="mt-1">
                  <VariationBadge current={kpi.current} previous={kpi.previous} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">vs período anterior</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-4">
            {/* Step 1: Views */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-primary/10 rounded-xl py-4 text-center">
                <Eye className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{data.impressions}</p>
                <p className="text-xs text-muted-foreground">Visualizações</p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="flex flex-col items-center px-1">
              <ArrowDown className="h-5 w-5 text-muted-foreground rotate-[-90deg]" />
              <span className="text-xs font-semibold text-primary">{viewToClickRate}%</span>
            </div>

            {/* Step 2: Clicks */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-primary/10 rounded-xl py-4 text-center" style={{ width: `${Math.max(60, (data.clicks / Math.max(data.impressions, 1)) * 100)}%`, minWidth: "100%" }}>
                <MousePointerClick className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{data.clicks}</p>
                <p className="text-xs text-muted-foreground">Cliques</p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="flex flex-col items-center px-1">
              <ArrowDown className="h-5 w-5 text-muted-foreground rotate-[-90deg]" />
              <span className="text-xs font-semibold text-primary">{clickToContactRate}%</span>
            </div>

            {/* Step 3: Contacts */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-green-500/10 rounded-xl py-4 text-center">
                <Phone className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{totalContacts}</p>
                <p className="text-xs text-muted-foreground">Contactos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Comparison + Peak Hour + Peak Day */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Period Comparison */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-3 text-center">Comparação com Período Anterior</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={comparisonData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="previous" fill="hsl(var(--muted-foreground)/0.3)" name="Anterior" radius={[4,4,0,0]} />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Atual" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hora de Pico */}
        <Card className="border-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <Clock className="h-6 w-6 text-primary" />
            <p className="text-xs text-muted-foreground">Hora de Pico</p>
            <p className="text-2xl font-bold">{getPeakHourLabel(data.peak_hour)}</p>
            <p className="text-xs text-muted-foreground">Os teus clientes estão mais ativos neste horário</p>
          </CardContent>
        </Card>

        {/* Dia Mais Ativo */}
        <Card className="border-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-2">
            <Calendar className="h-6 w-6 text-primary" />
            <p className="text-xs text-muted-foreground">Dia Mais Ativo</p>
            <p className="text-2xl font-bold">{getPeakDowLabel(data.peak_dow)}</p>
            <p className="text-xs text-muted-foreground">Dia da semana com mais interações</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown de Contactos — Todos os tipos */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-4 text-center font-medium">Cliques por Tipo de Contacto</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Full breakdown list */}
            <div className="space-y-2">
              {sortedContacts.map((c) => (
                <div key={c.name} className={`flex items-center gap-3 text-sm ${c.value === 0 ? "opacity-50" : ""}`}>
                  <span className="text-base w-6 text-center flex-shrink-0">{c.icon}</span>
                  <span className="text-muted-foreground min-w-[100px]">{c.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${(c.value / maxContactValue) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground w-8 text-right">{c.value}</span>
                </div>
              ))}
            </div>
            {/* Right: Pie chart (top 4 only) */}
            {totalContacts > 0 && contactPieData.length > 0 && (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={contactPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {contactPieData.map((_, index) => (
                        <Cell key={index} fill={CONTACT_COLORS[index % CONTACT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} cliques`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {totalContacts === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem contactos no período</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tendência */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tendência</CardTitle>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {data.trend.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de tendência</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => `Dia ${v}`}
                />
                <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} name="Visualizações" />
                <Area type="monotone" dataKey="clicks" stroke="#22c55e" fill="rgba(34,197,94,0.1)" strokeWidth={2} name="Cliques" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessPerformanceCard;
