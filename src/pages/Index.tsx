import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedBusinesses } from "@/hooks/useBusinesses";
import { useHomepageBlocks } from "@/hooks/useHomepageBlocks";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuperHighlightsSection from "@/components/SuperHighlightsSection";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";
import HomepageBlockRenderer from "@/components/HomepageBlockRenderer";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: featuredBusinesses = [], isLoading: featuredLoading } = useFeaturedBusinesses();
  const { data: blocks = [] } = useHomepageBlocks();

  const useBlocks = blocks.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {useBlocks ? (
          // Dynamic rendering from homepage_blocks
          blocks.map((block) => (
            <HomepageBlockRenderer
              key={block.id}
              block={block}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          ))
        ) : (
          // Fallback: hardcoded layout
          <>
            <HeroSection searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <SuperHighlightsSection />
            <FeaturedCategoriesSection />
            <CategoriesGrid categories={categories} isLoading={categoriesLoading} />
            <FeaturedSection businesses={featuredBusinesses} isLoading={featuredLoading} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
