import { Link } from "react-router-dom";
import { useFeaturedCategories } from "@/hooks/useFeaturedCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect } from "react";

// Padrão bento: define o tamanho de cada card por posição (índice % 8)
// "tall" = rowspan 2, "wide" = colspan 2, "normal" = 1x1
const BENTO_PATTERN: Array<"normal" | "tall" | "wide"> = [
  "wide", // 0 — destaque horizontal
  "tall", // 1 — destaque vertical
  "normal", // 2
  "normal", // 3
  "normal", // 4
  "wide", // 5 — destaque horizontal
  "normal", // 6
  "tall", // 7 — destaque vertical
];

interface VideoCardProps {
  src: string;
  alt: string;
}

const VideoCard = ({ src, alt }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Intersection Observer para só reproduzir quando visível
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Suporte a YouTube — extrai ID e usa thumbnail + link direto não é possível em <video>,
  // por isso para YouTube usamos um iframe sem controlos
  const isYouTube = src.includes("youtube.com") || src.includes("youtu.be");

  if (isYouTube) {
    const videoId = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1];
    if (!videoId) return null;
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen={false}
        title={alt}
        className="w-full h-full object-cover"
        style={{ border: "none", pointerEvents: "none" }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      aria-label={alt}
    />
  );
};

const FeaturedCategoriesSection = () => {
  const { data: featured = [], isLoading } = useFeaturedCategories();

  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">Encontre por categoria</h2>
        <p className="text-muted-foreground text-center mb-8 -mt-4">Escolha a área de negócio que procura</p>

        {isLoading ? (
          // Skeleton com proporções do bento
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "180px",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="rounded-2xl"
                style={{
                  gridColumn: i === 0 || i === 5 ? "span 2" : "span 1",
                  gridRow: i === 1 || i === 7 ? "span 2" : "span 1",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gridAutoRows: "180px",
            }}
          >
            {featured.map((fc, index) => {
              const pattern = BENTO_PATTERN[index % BENTO_PATTERN.length];
              const isWide = pattern === "wide";
              const isTall = pattern === "tall";

              // video_url vem do join com categories — ver nota abaixo
              const videoUrl: string | null = (fc as any).video_url || (fc.categories as any)?.video_url || null;

              const imageUrl = fc.cover_image_url;
              const name = fc.categories?.name || "Categoria";
              const slug = fc.categories?.slug || "";

              return (
                <Link
                  key={fc.id}
                  to={`/categoria/${slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{
                    gridColumn: isWide ? "span 2" : "span 1",
                    gridRow: isTall ? "span 2" : "span 1",
                  }}
                  aria-label={`Ver categoria ${name}`}
                >
                  {/* Media — vídeo ou imagem */}
                  <div className="absolute inset-0">
                    {videoUrl ? (
                      <VideoCard src={videoUrl} alt={name} />
                    ) : imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3
                      className={`text-white font-semibold drop-shadow-md transition-transform duration-300 group-hover:translate-y-[-2px] ${
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
