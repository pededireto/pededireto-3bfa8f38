import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Building2, MapPin, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NewBusinessesBlockProps {
  config?: {
    limite?: number;
    titulo_secao?: string;
    titulo?: string;
    show_more?: boolean;
    ordenacao?: string;
  } | null;
  title?: string | null;
}

const NewBusinessesBlock = ({ config, title }: NewBusinessesBlockProps) => {
  const limite = config?.limite || 6;
  const tituloSecao = title || config?.titulo || config?.titulo_secao || "Novos na Plataforma";
  const showMore = config?.show_more !== false;
  const ordenacao = config?.ordenacao || "recentes";

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["new-businesses", limite, ordenacao],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(`
          id,
          name,
          slug,
          city,
          description,
          logo_url,
          created_at,
          ranking_score,
          categories (
            name,
            slug
          )
        `)
        .eq("is_active", true);

      if (ordenacao === "melhor_avaliados") {
        query = query.order("ranking_score", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(limite);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {tituloSecao}
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            Novidades
          </Badge>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Link
              key={business.id}
              to={`/negocio/${business.slug}`}
              className="group bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-primary/20"
            >
              {/* Logo */}
              <div className="relative aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Building2 className="w-16 h-16 text-primary/30" />
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-success text-white shadow-lg">
                    Novo
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {business.name}
                </h3>

                {business.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {business.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  {business.city && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{business.city}</span>
                    </div>
                  )}

                  {business.categories && (
                    <Badge variant="outline" className="text-xs">
                      {business.categories.name}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {showMore && (
          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link to="/pesquisa?ordem=recentes">
                Ver mais negócios <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewBusinessesBlock;
