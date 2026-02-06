import { 
  Building2, 
  FolderOpen, 
  Star, 
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { BusinessWithCategory } from "@/hooks/useBusinesses";
import { Category } from "@/hooks/useCategories";
import { Suggestion } from "@/hooks/useSuggestions";
import { Badge } from "@/components/ui/badge";

interface DashboardContentProps {
  businesses: BusinessWithCategory[];
  categories: Category[];
  suggestions: Suggestion[];
}

const StatCard = ({ title, value, icon: Icon, trend }: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  trend?: string;
}) => (
  <div className="bg-card rounded-xl p-6 shadow-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        {trend && (
          <p className="text-xs text-primary flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </div>
);

const DashboardContent = ({ businesses, categories, suggestions }: DashboardContentProps) => {
  const featuredCount = businesses.filter(b => b.is_featured).length;
  const premiumCount = businesses.filter(b => b.is_premium).length;
  const activeBusinesses = businesses.filter(b => b.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da plataforma Pede Direto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Negócios" 
          value={businesses.length} 
          icon={Building2}
        />
        <StatCard 
          title="Ativos" 
          value={activeBusinesses} 
          icon={Building2}
        />
        <StatCard 
          title="Em Destaque" 
          value={featuredCount} 
          icon={Star}
        />
        <StatCard 
          title="Categorias" 
          value={categories.filter(c => c.is_active).length} 
          icon={FolderOpen}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Negócios Recentes</h2>
          <div className="space-y-3">
            {businesses.slice(0, 5).map((business) => (
              <div key={business.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                {business.logo_url ? (
                  <img 
                    src={business.logo_url} 
                    alt={business.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary/50">
                      {business.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{business.name}</h3>
                  <p className="text-sm text-muted-foreground">{business.categories?.name}</p>
                </div>
                <div className="flex gap-1">
                  {business.is_featured && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Destaque
                    </Badge>
                  )}
                  {business.is_premium && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {businesses.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum negócio adicionado ainda.
              </p>
            )}
          </div>
        </div>

        {/* Recent Suggestions */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Sugestões Recentes</h2>
            <Badge variant="secondary">{suggestions.length}</Badge>
          </div>
          <div className="space-y-3">
            {suggestions.slice(0, 5).map((suggestion) => (
              <div key={suggestion.id} className="p-3 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground">{suggestion.city_name}</p>
                {suggestion.message && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {suggestion.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(suggestion.created_at).toLocaleDateString("pt-PT")}
                </p>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma sugestão recebida.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
