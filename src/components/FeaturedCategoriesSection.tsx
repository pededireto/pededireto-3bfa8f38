import { Link } from "react-router-dom";
import { useFeaturedCategories } from "@/hooks/useFeaturedCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect } from "react";

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

const FeaturedCategoriesSection = () => {
  const { data: featured = [], isLoading } = useFeaturedCategories();

  if (!isLoading && featured.length === 0) return null;

  return (
    <section id="categorias" className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">Encontre por categoria</h2>
        <p className="text-muted-foreground text-center mb-8">Escolha a área de negócio que procura</p>

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
            {featured.map((fc, index) => {
              const pattern = BENTO_PATTERN[index % BENTO_PATTERN.length];
              const isWide = pattern === "wide";
              const isTall = pattern === "tall";

              const name = fc.categories?.name ?? "Categoria";
              const slug = fc.categories?.slug ?? "";

              // Prioridade: video_url da categoria → cover_image_url do featured → image_url da categoria
              const videoUrl = fc.categories?.video_url ?? null;
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
