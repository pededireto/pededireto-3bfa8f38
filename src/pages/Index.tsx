import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedBusinesses } from "@/hooks/useBusinesses";
import { useHomepageBlocks } from "@/hooks/useHomepageBlocks";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";
import SuperHighlightsSection from "@/components/SuperHighlightsSection";
import PlatformStats from "@/components/PlatformStats";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import LatestBlogPosts from "@/components/LatestBlogPosts";
import HomepageBlockRenderer from "@/components/HomepageBlockRenderer";
import CityFilterBar from "@/components/CityFilterBar";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
            <CityFilterBar />
            <PlatformStats />
            <FeaturedCategoriesSection />
            <HowItWorks />
            <SuperHighlightsSection />
            <BusinessCTA />
            <LatestBlogPosts />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
