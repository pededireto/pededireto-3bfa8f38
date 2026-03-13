import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import SuggestionForm from "@/components/SuggestionForm";
import { supabase } from "@/integrations/supabase/client";
import { useSubcategory } from "@/hooks/useSubcategories";
import { useCategory } from "@/hooks/useCategories";
import { BusinessWithCategory } from "@/hooks/useBusinesses";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "https://pededireto.pt";

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const capitalize = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/* ── hook: businesses by subcategory + city ─── */

const useSubcategoryCityBusinesses = (subcategoryId?: string, cityName?: string) =>
  useQuery({
    queryKey: ["subcategory-city-businesses", subcategoryId, cityName],
    queryFn: async () => {
      // 1. Get business IDs from junction table
      const { data: junctionData, error: jError } = await supabase
        .from("business_subcategories")
        .select("business_id")
        .eq("subcategory_id", subcategoryId!);

      if (jError) throw jError;
      if (!junctionData || junctionData.length === 0) return [];

      const businessIds = junctionData.map((j) => j.business_id);

      // 2. Also get businesses that serve this city via business_cities
      const { data: cityJunction } = await supabase
        .from("business_cities")
        .select("business_id")
        .ilike("city_name", `%${cityName}%`);

      const cityBizIds = new Set((cityJunction || []).map((c) => c.business_id));
      const subcatBizIds = new Set(businessIds);

      // 3. Get businesses filtered by city (from businesses.city column)
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          *,
          categories(id, name, slug, icon),
          subcategories(id, name, slug),
          business_review_stats(average_rating, total_reviews)
        `)
        .eq("is_active", true)
        .in("id", businessIds)
        .or(`city.ilike.%${cityName}%,alcance.eq.nacional`)
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("ranking_score", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) throw error;

      // 4. Also fetch businesses only found in business_cities junction
      const resultIds = new Set((data || []).map((b: any) => b.id));
      const missingIds = [...cityBizIds].filter((id) => subcatBizIds.has(id) && !resultIds.has(id));

      if (missingIds.length > 0) {
        const { data: extra } = await supabase
          .from("businesses")
          .select(`
            *,
            categories(id, name, slug, icon),
            subcategories(id, name, slug),
            business_review_stats(average_rating, total_reviews)
          `)
          .eq("is_active", true)
          .in("id", missingIds);
        if (extra) return [...(data as unknown as BusinessWithCategory[]), ...(extra as unknown as BusinessWithCategory[])];
      }

      return data as unknown as BusinessWithCategory[];
    },
    enabled: !!subcategoryId && !!cityName,
  });

/* ── hook: other cities for this subcategory (with count) ─── */

const useOtherCitiesForSubcategory = (subcategoryId?: string, currentCity?: string) =>
  useQuery({
    queryKey: ["subcategory-other-cities", subcategoryId, currentCity],
    queryFn: async () => {
      const { data: junctionData, error: jError } = await supabase
        .from("business_subcategories")
        .select("business_id")
        .eq("subcategory_id", subcategoryId!);

      if (jError) throw jError;
      if (!junctionData || junctionData.length === 0) return [];

      const businessIds = junctionData.map((j) => j.business_id);

      // Get cities from businesses.city
      const { data, error } = await supabase
        .from("businesses")
        .select("city")
        .eq("is_active", true)
        .in("id", businessIds)
        .not("city", "is", null);

      if (error) throw error;

      // Also get cities from business_cities junction
      const { data: cityJunction } = await supabase
        .from("business_cities")
        .select("business_id, city_name")
        .in("business_id", businessIds);

      const cityCountMap = new Map<string, { name: string; count: number }>();
      const currentSlug = slugify(currentCity || "");

      // Count from businesses.city
      for (const b of data ?? []) {
        if (!b.city) continue;
        const key = slugify(b.city);
        if (key === currentSlug) continue;
        const existing = cityCountMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityCountMap.set(key, { name: b.city, count: 1 });
        }
      }

      // Count from business_cities junction (add unique businesses)
      const businessCityPairs = new Set<string>();
      for (const b of data ?? []) {
        if (b.city) businessCityPairs.add(`${slugify(b.city)}`);
      }
      for (const cj of cityJunction ?? []) {
        const key = slugify(cj.city_name);
        if (key === currentSlug) continue;
        // Only count if this business wasn't already counted via businesses.city
        const existing = cityCountMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityCountMap.set(key, { name: cj.city_name, count: 1 });
        }
      }

      return Array.from(cityCountMap.entries())
        .map(([slug, { name, count }]) => ({ slug, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    enabled: !!subcategoryId,
  });

/* ── page ────────────────────────────── */

interface SubcategoryCityPageProps {
  overrideCategorySlug?: string;
  overrideSubcategorySlug?: string;
  overrideCitySlug?: string;
  isShortUrl?: boolean;
}

const SubcategoryCityPage = ({
  overrideCategorySlug,
  overrideSubcategorySlug,
  overrideCitySlug,
  isShortUrl = false,
}: SubcategoryCityPageProps = {}) => {
  const params = useParams<{
    categorySlug: string;
    subcategorySlug: string;
    citySlug: string;
  }>();

  const categorySlug = overrideCategorySlug || params.categorySlug;
  const subcategorySlug = overrideSubcategorySlug || params.subcategorySlug;
  const citySlug = overrideCitySlug || params.citySlug;

  const cityDisplay = capitalize(citySlug || "");
  const { data: subcategory, isLoading: subLoading } = useSubcategory(subcategorySlug);
  const { data: category, isLoading: catLoading } = useCategory(categorySlug);
  const { data: businesses = [], isLoading: bizLoading } = useSubcategoryCityBusinesses(
    subcategory?.id,
    cityDisplay
  );
  const { data: otherCities = [] } = useOtherCitiesForSubcategory(subcategory?.id, cityDisplay);

  const isLoading = subLoading || catLoading || bizLoading;

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  /* ── 404 ── */
  if (!subcategory || !category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
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
  const subcategoryName = subcategory.name;
  const categoryName = category.name;

  const pageTitle = `${subcategoryName} em ${cityDisplay} | Pede Direto`;

  const pageDescription = subcategory.description
    ? `${subcategory.description.slice(0, 100).trim()} Encontre ${subcategoryName.toLowerCase()} em ${cityDisplay}. Contacte diretamente, sem intermediários.`
    : `Encontre os melhores ${subcategoryName.toLowerCase()} em ${cityDisplay}. Contacte diretamente, sem intermediários — só no Pede Direto.`;

  const canonicalUrl = `${BASE_URL}/s/${subcategorySlug}/${citySlug}`;
  const pageUrl = isShortUrl
    ? canonicalUrl
    : `${BASE_URL}/categoria/${categorySlug}/${subcategorySlug}/cidade/${citySlug}`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${subcategoryName} em ${cityDisplay}`,
    description: pageDescription,
    url: pageUrl,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        url: `${BASE_URL}/negocio/${b.slug}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: cityDisplay,
          addressCountry: "PT",
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${BASE_URL}/categoria/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: subcategoryName,
        item: `${BASE_URL}/categoria/${categorySlug}/${subcategorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: cityDisplay,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-foreground">Início</Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link to={`/categoria/${categorySlug}`} className="hover:text-foreground">{categoryName}</Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link to={`/categoria/${categorySlug}/${subcategorySlug}`} className="hover:text-foreground">
                {subcategoryName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-foreground font-medium">{cityDisplay}</span>
            </nav>
          </div>
        </section>

        {/* Header */}
        <section className="section-hero py-8 md:py-12">
          <div className="container">
            <Link
              to={`/categoria/${categorySlug}/${subcategorySlug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar a {subcategoryName}
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {subcategoryName} em {cityDisplay}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Encontre os melhores {subcategoryName.toLowerCase()} em {cityDisplay}. Contacte diretamente, sem intermediários.
            </p>
          </div>
        </section>

        {/* SEO intro text */}
        {businesses.length > 0 && (
          <section className="pb-4">
            <div className="container">
              <p className="text-sm text-muted-foreground max-w-3xl">
                Encontre os melhores {subcategoryName.toLowerCase()} em {cityDisplay}. O Pede Direto lista {businesses.length} profissiona{businesses.length === 1 ? "l verificado" : "is verificados"} em {cityDisplay}, com avaliações reais de clientes, horários e contactos directos. Compare orçamentos e escolha o profissional certo para si.
              </p>
            </div>
          </section>
        )}

        {/* Business Grid */}
        {businesses.length > 0 ? (
          <section className="py-12">
            <div className="container">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {businesses.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="py-12">
            <div className="container">
              <div className="text-center py-12 bg-muted/50 rounded-2xl">
                <p className="text-muted-foreground mb-4">
                  Ainda não temos {subcategoryName.toLowerCase()} registados em {cityDisplay}.
                </p>
                <p className="text-muted-foreground mb-6">Conhece algum?</p>
                <SuggestionForm searchTerm={`${subcategoryName} em ${cityDisplay}`} />
              </div>
            </div>
          </section>
        )}

        {/* Other Cities */}
        {otherCities.length > 0 && (
          <section className="border-t border-border py-8">
            <div className="container">
              <h2 className="text-xl font-semibold mb-4">
                Também disponível noutras cidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c) => (
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
          </section>
        )}

        {/* Back link */}
        <section className="border-t border-border py-6">
          <div className="container">
            <Link
              to={`/categoria/${categorySlug}/${subcategorySlug}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todos os {subcategoryName} em Portugal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryCityPage;
