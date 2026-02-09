import { BusinessWithCategory, useUpdateBusiness, PremiumLevel } from "@/hooks/useBusinesses";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Star, Building2, ArrowUp, ArrowDown, Loader2, Crown } from "lucide-react";
import { useState } from "react";

interface FeaturedContentProps {
  businesses: BusinessWithCategory[];
}

const premiumLevelLabels: Record<string, string> = {
  SUPER: "Super Destaque",
  CATEGORIA: "Destaque Categoria",
  SUBCATEGORIA: "Destaque Subcategoria",
};

const FeaturedContent = ({ businesses }: FeaturedContentProps) => {
  const { toast } = useToast();
  const updateBusiness = useUpdateBusiness();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const superBusinesses = businesses
    .filter(b => b.is_premium && b.premium_level === "SUPER")
    .sort((a, b) => a.display_order - b.display_order);

  const categoryBusinesses = businesses
    .filter(b => b.is_premium && (b.premium_level === "CATEGORIA" || b.premium_level === "SUBCATEGORIA"))
    .sort((a, b) => a.display_order - b.display_order);

  const featuredBusinesses = businesses
    .filter(b => b.is_featured && !b.is_premium)
    .sort((a, b) => a.display_order - b.display_order);

  const nonFeaturedBusinesses = businesses
    .filter(b => !b.is_featured && !b.is_premium && b.is_active)
    .slice(0, 10);

  const toggleFeatured = async (business: BusinessWithCategory) => {
    setUpdatingId(business.id);
    try {
      await updateBusiness.mutateAsync({
        id: business.id,
        is_featured: !business.is_featured,
      });
      toast({ title: business.is_featured ? "Removido dos destaques" : "Adicionado aos destaques" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const updatePremiumLevel = async (business: BusinessWithCategory, level: PremiumLevel | "none") => {
    setUpdatingId(business.id);
    try {
      if (level === "none") {
        await updateBusiness.mutateAsync({ id: business.id, is_premium: false, premium_level: null as any });
      } else {
        await updateBusiness.mutateAsync({ id: business.id, is_premium: true, premium_level: level });
      }
      toast({ title: "Nível premium atualizado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOrder = async (business: BusinessWithCategory, newOrder: number) => {
    try {
      await updateBusiness.mutateAsync({ id: business.id, display_order: newOrder });
    } catch {
      toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
    }
  };

  const renderBusinessRow = (business: BusinessWithCategory, index: number, list: BusinessWithCategory[], showPremium: boolean = false) => (
    <div key={business.id} className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { if (index > 0) updateOrder(business, list[index - 1].display_order - 1); }} disabled={index === 0}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { if (index < list.length - 1) updateOrder(business, list[index + 1].display_order + 1); }} disabled={index === list.length - 1}>
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      {business.logo_url ? (
        <img src={business.logo_url} alt={business.name} className="w-12 h-12 rounded-lg object-cover" />
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
        {showPremium && (
          <Select
            value={business.premium_level || "none"}
            onValueChange={(v) => updatePremiumLevel(business, v as PremiumLevel | "none")}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem Premium</SelectItem>
              <SelectItem value="SUPER">Super</SelectItem>
              <SelectItem value="CATEGORIA">Categoria</SelectItem>
              <SelectItem value="SUBCATEGORIA">Subcategoria</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Input type="number" value={business.display_order} onChange={(e) => updateOrder(business, parseInt(e.target.value) || 0)} className="w-20 text-center" />
        {updatingId === business.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Switch checked={business.is_featured || business.is_premium} onCheckedChange={() => showPremium ? updatePremiumLevel(business, "none") : toggleFeatured(business)} />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Destaques & Premium</h1>
        <p className="text-muted-foreground">Gerir destaques e níveis premium na plataforma</p>
      </div>

      {/* SUPER Highlights */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Super Destaques (Homepage)</h2>
          <Badge variant="secondary" className="bg-accent/10 text-accent">{superBusinesses.length}</Badge>
        </div>
        <div className="space-y-3">
          {superBusinesses.map((b, i) => renderBusinessRow(b, i, superBusinesses, true))}
          {superBusinesses.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum Super Destaque configurado.</p>}
        </div>
      </div>

      {/* Category/Subcategory Highlights */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Destaques por Categoria / Subcategoria</h2>
          <Badge variant="secondary">{categoryBusinesses.length}</Badge>
        </div>
        <div className="space-y-3">
          {categoryBusinesses.map((b, i) => renderBusinessRow(b, i, categoryBusinesses, true))}
          {categoryBusinesses.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum destaque por categoria configurado.</p>}
        </div>
      </div>

      {/* Regular Featured */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Destaques Gerais</h2>
          <Badge variant="secondary">{featuredBusinesses.length}</Badge>
        </div>
        <div className="space-y-3">
          {featuredBusinesses.map((b, i) => renderBusinessRow(b, i, featuredBusinesses))}
          {featuredBusinesses.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum destaque geral.</p>}
        </div>
      </div>

      {/* Add to Featured */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold mb-4">Adicionar aos Destaques</h2>
        <div className="space-y-2">
          {nonFeaturedBusinesses.map((business) => (
            <div key={business.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{business.name}</h3>
                <p className="text-sm text-muted-foreground">{business.categories?.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updatePremiumLevel(business, "SUPER")} disabled={updatingId === business.id}>
                  <Crown className="h-4 w-4 mr-1" /> Super
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleFeatured(business)} disabled={updatingId === business.id}>
                  <Star className="h-4 w-4 mr-1" /> Destaque
                </Button>
              </div>
            </div>
          ))}
          {nonFeaturedBusinesses.length === 0 && <p className="text-muted-foreground text-center py-4">Sem negócios disponíveis.</p>}
        </div>
      </div>
    </div>
  );
};

export default FeaturedContent;
