import { Link } from "react-router-dom";
import { useFeaturedCategories } from "@/hooks/useFeaturedCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect } from "react";

interface FeaturedCategoriesSectionProps {
  config?: Record<string, any> | null;
}

const BENTO_PATTERN: Array<"normal" | "tall" | "wide"> = [
  "wide",
  "tall",
  "normal",
  "normal",
  "normal",
  "wide",
  "normal",
  "tall",
];

const isYouTubeUrl = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

const isBase64 = (url: string) => url.startsWith("data:");

const getYouTubeEmbedUrl = (url: string): string => {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (match)
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1&rel=0`;
  return url;
};

const CategoryMedia = ({
  videoUrl,
  imageUrl,
  name,
}: {
  videoUrl: string | null;
  imageUrl: string | null;
  name: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // 1. YouTube
  if (videoUrl && isYouTubeUrl(videoUrl)) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(videoUrl)}
        allow="autoplay; encrypted-media"
        title={name}
        className="w-full h-full"
        style={{ border: "none", pointerEvents: "none" }}
      />
    );
  }

  // 2. mp4 / Supabase
  if (videoUrl) {
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        aria-label={name}
      />
    );
  }

  // 3. Imagem URL normal
  if (imageUrl && !isBase64(imageUrl)) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    );
  }

  // 4. Imagem base64
  if (imageUrl && isBase64(imageUrl)) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  // 5. Fallback sem média
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
      <span className="text-4xl font-bold text-white/30 select-none">{name.charAt(0)}</span>
    </div>
  );
};

const FeaturedCategoriesSection = ({ config }: FeaturedCategoriesSectionProps) => {
  const { data: featured = [], isLoading } = useFeaturedCategories();

  const title = config?.titulo || "Encontre por categoria";
  const subtitle = config?.subtitulo || "Escolha a área de negócio que procura";
  const maxItems = Math.max(1, Number(config?.max_items) || 8);
  const selectedIds = Array.isArray(config?.selected_categories) ? config.selected_categories : [];

  const visibleFeatured = (selectedIds.length
    ? featured.filter((item) => item.category_id && selectedIds.includes(item.category_id))
    : featured
  ).slice(0, maxItems);

  if (!isLoading && visibleFeatured.length === 0) return null;

  return (
    <section id="categorias" className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">{title}</h2>
        <p className="text-muted-foreground text-center mb-8">{subtitle}</p>

        {isLoading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "180px" }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const p = BENTO_PATTERN[i];
              return (
                <Skeleton
                  key={i}
                  className="rounded-2xl"
                  style={{
                    gridColumn: p === "wide" ? "span 2" : "span 1",
                    gridRow: p === "tall" ? "span 2" : "span 1",
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "180px" }}>
            {visibleFeatured.map((fc, index) => {
              const pattern = BENTO_PATTERN[index % BENTO_PATTERN.length];
              const isWide = pattern === "wide";
              const isTall = pattern === "tall";

              const name = fc.categories?.name ?? "Categoria";
              const slug = fc.categories?.slug ?? "";

              // Priority: featured video_url → category video_url → featured cover_image_url → category image_url
              const videoUrl = fc.video_url || fc.categories?.video_url || null;
              const imageUrl = fc.cover_image_url || fc.categories?.image_url || null;

              return (
                <Link
                  key={fc.id}
                  to={`/categoria/${slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    gridColumn: isWide ? "span 2" : "span 1",
                    gridRow: isTall ? "span 2" : "span 1",
                  }}
                  aria-label={`Ver categoria ${name}`}
                >
                  <div className="absolute inset-0">
                    <CategoryMedia videoUrl={videoUrl} imageUrl={imageUrl} name={name} />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3
                      className={`text-white font-semibold drop-shadow-md transition-transform duration-300 group-hover:-translate-y-0.5 ${
                        isWide || isTall ? "text-base md:text-xl" : "text-sm md:text-base"
                      }`}
                    >
                      {name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategoriesSection;
