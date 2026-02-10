import { Link } from "react-router-dom";
import { useFeaturedCategories } from "@/hooks/useFeaturedCategories";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedCategoriesSection = () => {
  const { data: featured = [], isLoading } = useFeaturedCategories();

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
          Categorias em Destaque
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((fc) => (
              <Link
                key={fc.id}
                to={`/categoria/${fc.categories?.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-video">
                  <img
                    src={fc.cover_image_url}
                    alt={fc.categories?.name || "Categoria"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm md:text-base lg:text-lg drop-shadow-md">
                    {fc.categories?.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategoriesSection;
