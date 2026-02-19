import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Eye, MousePointerClick, Target, MapPin, Search, TrendingUp, TrendingDown, Clock, Calendar, Phone, MessageCircle, Globe, Mail } from "lucide-react";
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
  const kpis = [
    {
      label: "Visualizações",
      value: data.impressions.toLocaleString("pt-PT"),
      icon: Eye,
      current: data.impressions,
      previous: data.previous.impressions,
    },
    {
      label: "Cliques",
      value: data.clicks.toLocaleString("pt-PT"),
      icon: MousePointerClick,
      current: data.clicks,
      previous: data.previous.clicks,
    },
    {
      label: "CTR",
      value: `${data.ctr}%`,
      icon: Target,
      current: null,
      previous: null,
    },
    {
      label: "Pesquisas Categoria",
      value: data.searches_in_category.toLocaleString("pt-PT"),
      icon: Search,
      current: null,
      previous: null,
    },
    {
      label: "Pesquisas Cidade",
      value: data.searches_in_city.toLocaleString("pt-PT"),
      icon: MapPin,
      current: null,
      previous: null,
    },
  ];

  const contactPieData = [
    { name: "Telefone", value: data.contacts.click_phone, icon: Phone },
    { name: "Website", value: data.contacts.click_website, icon: Globe },
    { name: "WhatsApp", value: data.contacts.click_whatsapp, icon: MessageCircle },
    { name: "Email", value: data.contacts.click_email, icon: Mail },
  ].filter((c) => c.value > 0);

  const totalContacts = data.contacts.click_phone + data.contacts.click_whatsapp + data.contacts.click_website + data.contacts.click_email;

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

      {/* Peak Hour + Peak Day + Contact Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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

        {/* Breakdown de Contactos */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-3 text-center">Contactos por Canal</p>
            {totalContacts === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem contactos no período</p>
            ) : contactPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={contactPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {contactPieData.map((_, index) => (
                      <Cell key={index} fill={CONTACT_COLORS[index % CONTACT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} cliques`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="grid grid-cols-2 gap-1 mt-2">
              {[
                { label: "📞 Telefone", value: data.contacts.click_phone },
                { label: "💬 WhatsApp", value: data.contacts.click_whatsapp },
                { label: "🌐 Website", value: data.contacts.click_website },
                { label: "✉️ Email", value: data.contacts.click_email },
              ].map((c) => (
                <div key={c.label} className="flex justify-between text-xs px-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendência */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tendência</CardTitle>
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
