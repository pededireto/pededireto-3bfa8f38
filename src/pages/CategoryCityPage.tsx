import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import SuggestionForm from "@/components/SuggestionForm";
import { supabase } from "@/integrations/supabase/client";
import { useCategory } from "@/hooks/useCategories";
import { PublicBusinessWithCategory } from "@/hooks/usePublicBusinesses";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "https://pededireto.pt";

/* ── helpers ─────────────────────────── */

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

/* ── hook: businesses by category + city ─── */

const useCategoryCityBusinesses = (categoryId?: string, cityName?: string) =>
  useQuery({
    queryKey: ["category-city-businesses", categoryId, cityName],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("businesses_public")
        .select(`
          *,
          categories(id, name, slug, icon),
          subcategories(id, name, slug),
          business_review_stats(average_rating, total_reviews)
        `)
        .eq("category_id", categoryId)
        .ilike("city", cityName!)
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PublicBusinessWithCategory[];
    },
    enabled: !!categoryId && !!cityName,
  });

/* ── hook: other cities for this category ─── */

const useOtherCitiesForCategory = (categoryId?: string, currentCity?: string) =>
  useQuery({
    queryKey: ["category-other-cities", categoryId, currentCity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("city")
        .eq("category_id", categoryId!)
        .eq("is_active", true)
        .not("city", "is", null);

      if (error) throw error;

      // Deduplicate & exclude current city (case-insensitive)
      const cityMap = new Map<string, string>();
      for (const b of data ?? []) {
        if (!b.city) continue;
        const key = slugify(b.city);
        if (key === slugify(currentCity || "")) continue;
        if (!cityMap.has(key)) cityMap.set(key, b.city);
      }

      return Array.from(cityMap.entries())
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8);
    },
    enabled: !!categoryId,
  });

/* ── page ────────────────────────────── */

const CategoryCityPage = () => {
  const { categorySlug, citySlug } = useParams<{ categorySlug: string; citySlug: string }>();
  const navigate = useNavigate();

  const cityDisplay = capitalize(citySlug || "");
  const { data: category, isLoading: catLoading } = useCategory(categorySlug);
  const { data: businesses = [], isLoading: bizLoading } = useCategoryCityBusinesses(category?.id, cityDisplay);
  const { data: otherCities = [] } = useOtherCitiesForCategory(category?.id, cityDisplay);

  const isLoading = catLoading || bizLoading;

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
  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
            <Link to="/"><Button>Voltar ao início</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── SEO ── */
  const pageTitle = `${category.name} em ${cityDisplay} | Pede Direto`;
  const pageDescription = `Os melhores ${category.name.toLowerCase()} em ${cityDisplay}. Compare, contacte e contrate diretamente os melhores profissionais locais.`;
  const pageUrl = `${BASE_URL}/categoria/${categorySlug}/cidade/${citySlug}`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} em ${cityDisplay}`,
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

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="border-b border-border bg-muted/30">
          <div className="container py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Início</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/categoria/${categorySlug}`} className="hover:text-foreground">{category.name}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium">{cityDisplay}</span>
            </nav>
          </div>
        </section>

        {/* Header */}
        <section className="section-hero py-8 md:py-12">
          <div className="container">
            <Link
              to={`/categoria/${categorySlug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar a {category.name}
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {category.name} em {cityDisplay}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Encontre os melhores {category.name.toLowerCase()} em {cityDisplay}. Contacte diretamente, sem intermediários.
            </p>
          </div>
        </section>

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
                  Ainda não temos {category.name.toLowerCase()} registados em {cityDisplay}.
                </p>
                <p className="text-muted-foreground mb-6">Conhece algum?</p>
                <SuggestionForm searchTerm={`${category.name} em ${cityDisplay}`} />
              </div>
            </div>
          </section>
        )}

        {/* Other Cities */}
        {otherCities.length > 0 && (
          <section className="border-t border-border py-8">
            <div className="container">
              <h2 className="text-xl font-semibold mb-4">
                Outras cidades para {category.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c) => (
                  <Link key={c.slug} to={`/categoria/${categorySlug}/cidade/${c.slug}`}>
                    <Badge
                      variant="outline"
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {c.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryCityPage;
