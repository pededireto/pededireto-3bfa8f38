import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedBusinesses } from "@/hooks/useBusinesses";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuperHighlightsSection from "@/components/SuperHighlightsSection";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: featuredBusinesses = [], isLoading: featuredLoading } = useFeaturedBusinesses();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Super Destaques (Premium) */}
        <SuperHighlightsSection />

        {/* Categorias em Destaque */}
        <FeaturedCategoriesSection />

        <CategoriesGrid 
          categories={categories} 
          isLoading={categoriesLoading} 
        />

        <FeaturedSection 
          businesses={featuredBusinesses} 
          isLoading={featuredLoading} 
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
