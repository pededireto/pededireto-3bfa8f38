import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSubcategory, useSubcategories } from "@/hooks/useSubcategories";
import { useCategory } from "@/hooks/useCategories";
import { useBusinesses } from "@/hooks/useBusinesses";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessGrid from "@/components/BusinessGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuggestionForm from "@/components/SuggestionForm";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const BASE_URL = "https://pededireto.pt";

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ── hook: cities for this subcategory with counts ─── */

const useCitiesForSubcategory = (subcategoryId?: string) =>
  useQuery({
    queryKey: ["subcategory-cities", subcategoryId],
    queryFn: async () => {
      const { data: junctionData, error: jError } = await supabase
        .from("business_subcategories")
        .select("business_id")
        .eq("subcategory_id", subcategoryId!);

      if (jError) throw jError;
      if (!junctionData || junctionData.length === 0) return [];

      const businessIds = junctionData.map((j) => j.business_id);

      const { data, error } = await supabase
        .from("businesses")
        .select("city")
        .eq("is_active", true)
        .in("id", businessIds)
        .not("city", "is", null);

      if (error) throw error;

      const cityCountMap = new Map<string, { name: string; count: number }>();
      for (const b of data ?? []) {
        if (!b.city) continue;
        const key = slugify(b.city);
        const existing = cityCountMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityCountMap.set(key, { name: b.city, count: 1 });
        }
      }

      return Array.from(cityCountMap.entries())
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
    enabled: !!subcategoryId,
  });

const SubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const [cityFilter, setCityFilter] = useState("");

  const { data: subcategory, isLoading: subcategoryLoading } = useSubcategory(subcategorySlug);
  const { data: category } = useCategory(categorySlug);
  const { data: allSubcategories = [] } = useSubcategories(category?.id);
  const { data: cities = [] } = useCitiesForSubcategory(subcategory?.id);

  const { data: allBusinesses = [], isLoading: businessesLoading } = useBusinesses(
    undefined,
    cityFilter,
    subcategory?.id,
  );

  // Navegação anterior/próxima
  const currentIndex = allSubcategories.findIndex((s) => s.slug === subcategorySlug);
  const prevSubcategory = currentIndex > 0 ? allSubcategories[currentIndex - 1] : null;
  const nextSubcategory = currentIndex < allSubcategories.length - 1 ? allSubcategories[currentIndex + 1] : null;

  // Separar destacados dos normais
  const subcategoryFeatured = allBusinesses.filter((b) => b.is_featured);
  const regularBusinesses = allBusinesses.filter((b) => !b.is_featured);

  // Show text filter only if fewer than 3 cities
  const showTextFilter = cities.length < 3;

  if (subcategoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-64 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!subcategory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Subcategoria não encontrada</h1>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── SEO ── */
  const locationLabel = cityFilter.trim() ? `em ${cityFilter.trim()}` : "em Portugal";
  const pageTitle = `${subcategory.name} ${locationLabel} | ${category?.name || "Pede Direto"}`;
  const pageDescription = subcategory.description
    ? subcategory.description.slice(0, 155)
    : `Encontre profissionais de ${subcategory.name.toLowerCase()} ${locationLabel}. Contacte diretamente, sem intermediários — só no Pede Direto.`;
  const pageUrl = `${BASE_URL}/categoria/${categorySlug}/${subcategorySlug}`;
  const pageImage = subcategory.image_url || `${BASE_URL}/og-default.jpg`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${subcategory.name} ${locationLabel}`,
    description: pageDescription,
    url: pageUrl,
    numberOfItems: allBusinesses.length,
    itemListElement: allBusinesses.slice(0, 10).map((b: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      name: b.name,
      url: `${BASE_URL}/negocio/${b.slug}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:url" content={pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Subcategory Header */}
        <section className="section-hero py-8 md:py-12">
          <div className="container">
            <Link
              to={`/categoria/${categorySlug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar a {subcategory.categories?.name || "Categorias"}
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">{subcategory.name}</h1>

            {subcategory.description && (
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl">{subcategory.description}</p>
            )}

            {/* City Chips or Text Filter */}
            {showTextFilter ? (
              <div className="max-w-md">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filtrar por cidade..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Filtrar por cidade
                </p>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/categoria/${categorySlug}/${subcategorySlug}/cidade/${c.slug}`}
                    >
                      <Badge
                        variant="outline"
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {c.name} ({c.count})
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Featured */}
        {subcategoryFeatured.length > 0 && <FeaturedSection businesses={subcategoryFeatured} />}

        {/* All Businesses */}
        <BusinessGrid
          businesses={regularBusinesses}
          title={`${subcategory.name}`}
          isLoading={businessesLoading}
          emptyMessage={`Ainda não temos negócios de ${subcategory.name.toLowerCase()} registados.`}
        />

        {allBusinesses.length === 0 && !businessesLoading && (
          <div className="container pb-12">
            <SuggestionForm searchTerm={cityFilter || subcategory.name} />
          </div>
        )}

        {/* Subcategory Navigation */}
        <section className="border-t border-border py-6">
          <div className="container">
            <div className="flex items-center justify-between gap-4">
              {prevSubcategory ? (
                <Link
                  to={`/categoria/${categorySlug}/${prevSubcategory.slug}`}
                  className="flex items-center gap-3 group max-w-xs"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border group-hover:border-primary group-hover:text-primary transition-colors flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {prevSubcategory.name}
                    </p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextSubcategory ? (
                <Link
                  to={`/categoria/${categorySlug}/${nextSubcategory.slug}`}
                  className="flex items-center gap-3 group max-w-xs"
                >
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próxima</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {nextSubcategory.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border group-hover:border-primary group-hover:text-primary transition-colors flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryPage;
