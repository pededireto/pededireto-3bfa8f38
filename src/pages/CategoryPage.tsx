import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useCategory } from "@/hooks/useCategories";
import { useBusinesses, useFeaturedBusinesses } from "@/hooks/useBusinesses";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessGrid from "@/components/BusinessGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuggestionForm from "@/components/SuggestionForm";
import { Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [cityFilter, setCityFilter] = useState("");
  
  const { data: category, isLoading: categoryLoading } = useCategory(slug);
  const { data: featuredBusinesses = [], isLoading: featuredLoading } = useFeaturedBusinesses(category?.id);
  const { data: allBusinesses = [], isLoading: businessesLoading } = useBusinesses(category?.id, cityFilter);

  // Filter out featured from regular list
  const regularBusinesses = allBusinesses.filter(b => !b.is_featured);

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

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {category.name}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              Precisa de {category.name.toLowerCase()}? Estes contactos podem ajudar.
            </p>

            <p className="text-sm text-primary font-medium mb-6">
              {getContextualMessage()}
            </p>

            {/* City Filter */}
            {category.alcance_default !== "nacional" && (
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
            )}
          </div>
        </section>

        {/* Featured Businesses */}
        <FeaturedSection 
          businesses={featuredBusinesses} 
          isLoading={featuredLoading} 
        />

        {/* All Businesses */}
        <BusinessGrid
          businesses={regularBusinesses}
          title={`Mais ${category.name.toLowerCase()}`}
          isLoading={businessesLoading}
          emptyMessage={`Ainda não temos ${category.name.toLowerCase()} registados nesta área.`}
        />

        {/* Suggestion Form if no businesses */}
        {allBusinesses.length === 0 && !businessesLoading && (
          <div className="container pb-12">
            <SuggestionForm searchTerm={cityFilter || category.name} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
