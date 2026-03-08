import { useState } from "react";
import { Helmet } from "react-helmet-async";
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
import CategoryAccordion from "@/components/home/CategoryAccordion";
import LatestBlogPosts from "@/components/LatestBlogPosts";
import StickySearch from "@/components/StickySearch";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: featuredBusinesses = [], isLoading: featuredLoading } = useFeaturedBusinesses();
  const { data: blocks = [] } = useHomepageBlocks();

  const useBlocks = blocks.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>PedeDireto — Encontre Profissionais Locais em Portugal</title>
        <meta name="description" content="Conecte-se com os melhores profissionais locais. Canalizadores, electricistas, restaurantes e muito mais. Rápido, directo e sem intermediários." />
        <meta name="keywords" content="profissionais locais, canalizador, electricista, obras, portugal, pede direto" />
        <link rel="canonical" href="https://pededireto.pt" />
        <meta property="og:title" content="PedeDireto — Encontre Profissionais Locais em Portugal" />
        <meta property="og:description" content="Conecte-se com os melhores profissionais locais. Rápido, directo e sem intermediários." />
        <meta property="og:url" content="https://pededireto.pt" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />

      {/* 
        MAIN LANDMARK
        - id necessário para skip link
        - tabIndex=-1 necessário para foco programático em SPA
      */}
      <StickySearch />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {useBlocks ? (
          blocks.map((block) => (
            <HomepageBlockRenderer
              key={block.id}
              block={block}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          ))
        ) : (
          <>
            <HeroSection searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            <SuperHighlightsSection />

            <FeaturedCategoriesSection />

            <CategoryAccordion />

            <CategoriesGrid categories={categories} isLoading={categoriesLoading} />

            <FeaturedSection businesses={featuredBusinesses} isLoading={featuredLoading} />

            <LatestBlogPosts />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
