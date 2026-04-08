import { HomepageBlock } from "@/hooks/useHomepageBlocks";
import HeroSection from "@/components/HeroSection";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedSection from "@/components/FeaturedSection";
import SuperHighlightsSection from "@/components/SuperHighlightsSection";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";
import BannerBlock from "@/components/BannerBlock";
import TextBlock from "@/components/TextBlock";
import PremiumBusinessBlock from "@/components/PremiumBusinessBlock";
import NewBusinessesBlock from "@/components/NewBusinessesBlock";
import CategoryAccordion from "@/components/home/CategoryAccordion";
import PlatformStats from "@/components/PlatformStats";
import HowItWorks from "@/components/HowItWorks";
import BusinessCTA from "@/components/BusinessCTA";
import DualCTASection from "@/components/home/DualCTASection";
import SocialProofSection from "@/components/home/SocialProofSection";
import QuickServicesSection from "@/components/home/QuickServicesSection";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedBusinesses } from "@/hooks/useBusinesses";

interface HomepageBlockRendererProps {
  block: HomepageBlock;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const HomepageBlockRenderer = ({ block, searchTerm, onSearchChange }: HomepageBlockRendererProps) => {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: featuredBusinesses = [], isLoading: featuredLoading } = useFeaturedBusinesses();

  switch (block.type) {
    case "hero":
      return <HeroSection searchTerm={searchTerm} onSearchChange={onSearchChange} />;
    case "super_destaques":
      return <SuperHighlightsSection />;
    case "featured_categories":
      return <FeaturedCategoriesSection />;
    case "categorias":
      return <CategoriesGrid categories={categories} isLoading={categoriesLoading} />;
    case "destaques":
      return <FeaturedSection businesses={featuredBusinesses} isLoading={featuredLoading} />;
    case "banner":
      return <BannerBlock config={block.config} />;
    case "texto":
      return <TextBlock config={block.config} title={block.title} />;
    case "negocios_premium":
      return <PremiumBusinessBlock config={block.config} />;
    case "novos_negocios":
      return <NewBusinessesBlock config={block.config} title={block.title} />;
    case "categorias_accordion":
      return <CategoryAccordion />;
    case "platform_stats":
      return <PlatformStats />;
    case "how_it_works":
      return <HowItWorks />;
    case "business_cta":
      return <BusinessCTA />;
    case "dual_cta":
      return <DualCTASection config={block.config} />;
    case "social_proof":
      return <SocialProofSection config={block.config} />;
    case "quick_services":
      return <QuickServicesSection config={block.config} />;
    default:
      return null;
  }
};

export default HomepageBlockRenderer;
