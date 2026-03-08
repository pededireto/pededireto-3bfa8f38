import { useParams, Navigate } from "react-router-dom";
import { useSubcategory } from "@/hooks/useSubcategories";
import SubcategoryCityPage from "./SubcategoryCityPage";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * /s/:subSlug/:citySlug → resolves category from subcategory, renders SubcategoryCityPage
 * SEO-friendly short URL for subcategory + city combinations
 */
const SeoSubcategoryCityPage = () => {
  const { subSlug, citySlug } = useParams<{ subSlug: string; citySlug: string }>();
  const { data: subcategory, isLoading } = useSubcategory(subSlug);

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

  if (!subcategory?.categories?.slug) {
    return <Navigate to="/" replace />;
  }

  // Redirect to the canonical long URL which SubcategoryCityPage handles
  // But we use Navigate so it renders the same component without a visible redirect
  return (
    <SubcategoryCityPage
      overrideCategorySlug={subcategory.categories.slug}
      overrideSubcategorySlug={subSlug}
      overrideCitySlug={citySlug}
      isShortUrl
    />
  );
};

export default SeoSubcategoryCityPage;
