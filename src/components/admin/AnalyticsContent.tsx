import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { Loader2, Eye, MousePointerClick, MessageCircle, Phone, Globe, Mail } from "lucide-react";

const AnalyticsContent = () => {
  const { data: analytics, isLoading } = useAnalyticsSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Não foi possível carregar os analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Estatísticas de utilização da plataforma</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-3xl font-bold">{analytics.totalViews}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cliques</p>
              <p className="text-3xl font-bold">{analytics.totalClicks}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <MousePointerClick className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa Conversão</p>
              <p className="text-3xl font-bold">
                {analytics.totalViews > 0 
                  ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <MousePointerClick className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Clicks Breakdown */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">Categorias Mais Populares</h2>
          <div className="space-y-3">
            {analytics.topCategories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="font-medium">{cat.name}</span>
                <span className="text-muted-foreground">{cat.count} eventos</span>
              </div>
            ))}
            {analytics.topCategories.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Sem dados suficientes ainda.
              </p>
            )}
          </div>
        </div>

        {/* Top Businesses */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">Negócios Mais Clicados</h2>
          <div className="space-y-3">
            {analytics.topBusinesses.map((biz, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="font-medium">{biz.name}</span>
                <span className="text-muted-foreground">{biz.count} cliques</span>
              </div>
            ))}
            {analytics.topBusinesses.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Sem dados suficientes ainda.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;
