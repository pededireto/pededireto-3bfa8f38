import { BusinessWithCategory, useUpdateBusiness } from "@/hooks/useBusinesses";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Star, Building2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface FeaturedContentProps {
  businesses: BusinessWithCategory[];
}

const FeaturedContent = ({ businesses }: FeaturedContentProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusiness();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const featuredBusinesses = businesses
    .filter(b => b.is_featured)
    .sort((a, b) => a.display_order - b.display_order);

  const nonFeaturedBusinesses = businesses
    .filter(b => !b.is_featured && b.is_active)
    .slice(0, 10);

  const toggleFeatured = async (business: BusinessWithCategory) => {
    setUpdatingId(business.id);
    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        is_featured: !business.is_featured,
      });
      toast({
        title: business.is_featured ? "Removido dos destaques" : "Adicionado aos destaques",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o destaque",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOrder = async (business: BusinessWithCategory, newOrder: number) => {
    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        display_order: newOrder,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem",
        variant: "destructive",
      });
    }
  };

  const moveUp = (business: BusinessWithCategory, index: number) => {
    if (index === 0) return;
    const prev = featuredBusinesses[index - 1];
    updateOrder(business, prev.display_order - 1);
  };

  const moveDown = (business: BusinessWithCategory, index: number) => {
    if (index === featuredBusinesses.length - 1) return;
    const next = featuredBusinesses[index + 1];
    updateOrder(business, next.display_order + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Destaques</h1>
        <p className="text-muted-foreground">Gerir negócios em destaque na plataforma</p>
      </div>

      {/* Featured Businesses */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Negócios em Destaque</h2>
          <Badge variant="secondary">{featuredBusinesses.length}</Badge>
        </div>

        <div className="space-y-3">
          {featuredBusinesses.map((business, index) => (
            <div
              key={business.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => moveUp(business, index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => moveDown(business, index)}
                  disabled={index === featuredBusinesses.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{business.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {business.categories?.name} • {business.city || "Nacional"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={business.display_order}
                  onChange={(e) => updateOrder(business, parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
                {updatingId === business.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    checked={business.is_featured}
                    onCheckedChange={() => toggleFeatured(business)}
                  />
                )}
              </div>
            </div>
          ))}
          {featuredBusinesses.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Nenhum negócio em destaque. Use o botão abaixo para adicionar.
            </p>
          )}
        </div>
      </div>

      {/* Available to Feature */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Adicionar aos Destaques</h2>
        <div className="space-y-2">
          {nonFeaturedBusinesses.map((business) => (
            <div
              key={business.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
            >
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{business.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {business.categories?.name}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleFeatured(business)}
                disabled={updatingId === business.id}
              >
                {updatingId === business.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-1" />
                    Destacar
                  </>
                )}
              </Button>
            </div>
          ))}
          {nonFeaturedBusinesses.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Todos os negócios ativos já estão em destaque ou não há negócios disponíveis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedContent;
