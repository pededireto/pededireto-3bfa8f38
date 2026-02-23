import { useParams, Link } from "react-router-dom";
import { useCategory, useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SubcategoriesGrid from "@/components/SubcategoriesGrid";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useCategory(slug);
  const { data: allCategories = [] } = useCategories();
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useSubcategories(category?.id);

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

  return (
    <div className="min-h-screen flex flex-col">
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
