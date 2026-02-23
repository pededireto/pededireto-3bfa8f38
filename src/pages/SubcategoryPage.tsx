import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useSubcategory, useSubcategories } from "@/hooks/useSubcategories";
import { useCategory } from "@/hooks/useCategories";
import { useBusinesses } from "@/hooks/useBusinesses";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessGrid from "@/components/BusinessGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuggestionForm from "@/components/SuggestionForm";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const [cityFilter, setCityFilter] = useState("");

  const { data: subcategory, isLoading: subcategoryLoading } = useSubcategory(subcategorySlug);
  const { data: category } = useCategory(categorySlug);
  const { data: allSubcategories = [] } = useSubcategories(category?.id);

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

  return (
    <div className="min-h-screen flex flex-col">
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

            {/* City Filter */}
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
