import { useParams, Link } from "react-router-dom";
import { useCategory, useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubcategoriesGrid from "@/components/SubcategoriesGrid";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = "https://pededireto.pt";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useCategory(slug);
  const { data: allCategories = [] } = useCategories();
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories(category?.id);
  const { data: cities = [] } = useCitiesForCategory(category?.id);

  const currentIndex = allCategories.findIndex((c) => c.slug === slug);
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null;
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null;

  if (categoryLoading) {
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

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getContextualMessage = () => {
    switch (category.alcance_default) {
      case "nacional":
        return "Empresas que entregam em todo o país";
      case "local":
        return "Serviços disponíveis na sua zona";
      default:
        return "Encontre o que precisa";
    }
  };

  /* ===========================
     SEO DINÂMICO
  =========================== */

  const pageTitle = `${category.name} em Portugal | Pede Direto`;

  const pageDescription = category.description
    ? category.description.slice(0, 155)
    : `Encontre profissionais e serviços de ${category.name.toLowerCase()} perto de si. Contacte diretamente, sem intermediários.`;

  const pageUrl = `${BASE_URL}/categoria/${slug}`;

  const pageImage = category.image_url || `${BASE_URL}/og-default.jpg`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    description: pageDescription,
    url: pageUrl,
    numberOfItems: subcategories.length,
    itemListElement: subcategories.map((sub: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sub.name,
      url: `${BASE_URL}/categoria/${slug}/${sub.slug}`,
    })),
  };

  /* =========================== */

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
        {/* Category Header */}
        <section className="section-hero py-8 md:py-12">
          <div className="container">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar às categorias
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.name}</h1>
            <p className="text-lg text-muted-foreground mb-2 max-w-2xl">
              {category.description || `Precisa de ${category.name.toLowerCase()}? Escolha a área específica.`}
            </p>
            <p className="text-sm text-primary font-medium mb-8">{getContextualMessage()}</p>
          </div>
        </section>

        {/* City Chips */}
        {cities.length > 0 && (
          <section className="pb-8">
            <div className="container">
              <h2 className="text-lg font-semibold mb-3">
                {category.name} por cidade
              </h2>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link key={c.slug} to={`/categoria/${slug}/cidade/${c.slug}`}>
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

        {/* Subcategories Grid */}
        <section className="pb-12">
          <div className="container">
            <SubcategoriesGrid
              subcategories={subcategories}
              categorySlug={slug || ""}
              isLoading={subcategoriesLoading}
            />
          </div>
        </section>

        {/* Category Navigation */}
        <section className="border-t border-border py-6">
          <div className="container">
            <div className="flex items-center justify-between gap-4">
              {prevCategory ? (
                <Link to={`/categoria/${prevCategory.slug}`} className="flex items-center gap-3 group max-w-xs">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border group-hover:border-primary group-hover:text-primary transition-colors flex-shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {prevCategory.name}
                    </p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextCategory ? (
                <Link to={`/categoria/${nextCategory.slug}`} className="flex items-center gap-3 group max-w-xs">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próxima</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {nextCategory.name}
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

export default CategoryPage;
