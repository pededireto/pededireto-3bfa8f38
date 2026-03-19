import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Category } from "@/hooks/useCategories";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";
import {
  UtensilsCrossed,
  Wrench,
  Store,
  Hammer,
  Scissors,
  Briefcase,
  Car,
  Home,
  Heart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  LucideIcon,
} from "lucide-react";

interface CategoriesGridProps {
  categories: Category[];
  isLoading?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Wrench,
  Store,
  Hammer,
  Scissors,
  Briefcase,
  Car,
  Home,
  Heart,
  Sparkles,
};

// Sem bento por agora — todos os cards iguais, 4:3 como os SuperDestaques
const BENTO: Array<"normal" | "wide"> = ["normal", "normal", "normal", "normal", "normal", "normal"];

// ─── Helpers de média ─────────────────────────────────────────────────────────
const SUPABASE_VIDEO_BASE = "https://zzkkdgiabsqtagtdhpid.supabase.co/storage/v1/object/public/Video/";

const isYouTubeUrl = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

const isBase64 = (url: string) => url.startsWith("data:");

// Normaliza URLs relativas do bucket Video (ex: "1.mp4" → URL completa)
const normalizeVideoUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return SUPABASE_VIDEO_BASE + url;
};

const getYouTubeEmbedUrl = (url: string): string => {
  // Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/shorts\/([^?&/]+)/);
  if (shortsMatch)
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortsMatch[1]}&controls=0&playsinline=1&rel=0`;
  // Normal: youtube.com/watch?v=ID ou youtu.be/ID
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (match)
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1&rel=0`;
  return url;
};

// ─── Componente de média (vídeo ou imagem) ────────────────────────────────────
const CardMedia = ({
  videoUrl,
  imageUrl,
  name,
  className = "",
}: {
  videoUrl: string | null;
  imageUrl: string | null | undefined;
  name: string;
  className?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const normalized = videoUrl ? normalizeVideoUrl(videoUrl) : null;

  // Carrega o vídeo via fetch → blob URL, contornando CSP media-src
  useEffect(() => {
    if (!normalized || isYouTubeUrl(normalized)) return;
    let objectUrl: string;
    fetch(normalized)
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {}); // falha silenciosa — mostra imagem de fallback
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [normalized]);

  // Autoplay via IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !blobUrl) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, [blobUrl]);

  // 1. YouTube → iframe (não precisa de blob)
  if (normalized && isYouTubeUrl(normalized)) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(normalized)}
        allow="autoplay; encrypted-media"
        title={name}
        className={`w-full h-full ${className}`}
        style={{ border: "none", pointerEvents: "none" }}
      />
    );
  }

  // 2. mp4 via blob URL (Supabase)
  if (normalized) {
    // Enquanto o blob carrega, mostra imagem se disponível
    if (!blobUrl) {
      if (imageUrl) {
        return <img src={imageUrl} alt={name} className={`w-full h-full object-cover ${className}`} />;
      }
      return <div className={`w-full h-full bg-muted ${className}`} />;
    }
    return (
      <video
        ref={videoRef}
        src={blobUrl}
        muted
        loop
        playsInline
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
        aria-label={name}
      />
    );
  }

  // 3. Imagem URL normal ou base64
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
      />
    );
  }

  return null;
};

// ─── Vídeo do modal — com som, via blob ──────────────────────────────────────
// Modal: autoplay SEM som, SEM controls
const ModalVideo = ({ videoUrl, imageUrl, name }: { videoUrl: string; imageUrl?: string | null; name: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const normalized = normalizeVideoUrl(videoUrl);

  useEffect(() => {
    if (isYouTubeUrl(normalized)) return;
    let objectUrl: string;
    fetch(normalized)
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [normalized]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !blobUrl) return;
    video.play().catch(() => {});
  }, [blobUrl]);

  // YouTube no modal: muted, sem controls
  if (isYouTubeUrl(normalized)) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(normalized)}
        allow="autoplay; encrypted-media"
        title={name}
        className="w-full h-full min-h-[300px] md:min-h-[400px]"
        style={{ border: "none", pointerEvents: "none" }}
      />
    );
  }

  if (!blobUrl) {
    return (
      <div className="w-full min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-black">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </div>
    );
  }

  // mp4 no modal: muted, autoplay, sem controls
  return (
    <video
      ref={videoRef}
      src={blobUrl}
      muted
      loop
      playsInline
      className="w-full min-h-[300px] md:min-h-[400px] object-cover"
      aria-label={name}
    />
  );
};

// ─── Modal com navegação ──────────────────────────────────────────────────────
const CategoryModal = ({
  categories,
  initialIndex,
  onClose,
}: {
  categories: Category[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const category = categories[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < categories.length - 1;
  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);
  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, goPrev, goNext]);

  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
  const videoUrl = (category as any).video_url ?? null;
  const hasVideo = !!videoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-primary flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-primary flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      )}

      <div
        className={`relative z-10 w-full rounded-2xl overflow-hidden shadow-2xl ${hasVideo ? "max-w-4xl" : "max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* dots navegação */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {categories.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/90 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {hasVideo ? (
          /* ── Layout split: texto esquerda, vídeo direita ── */
          <div className="flex flex-col md:flex-row">
            {/* Mobile: vídeo em cima */}
            <div className="md:hidden bg-black">
              <ModalVideo videoUrl={videoUrl} imageUrl={category.image_url} name={category.name} />
            </div>
            {/* Coluna texto */}
            <div className="bg-card flex flex-col justify-between p-6 md:w-2/5 space-y-5">
              <div className="space-y-3 pt-4 md:pt-8">
                <h2 className="text-2xl font-bold">{category.name}</h2>
                {category.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{category.description}</p>
                )}
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/categoria/${category.slug}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors text-base"
                >
                  Ver {category.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={goPrev}
                    disabled={!hasPrev}
                    className="flex-1 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!hasNext}
                    className="flex-1 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {currentIndex + 1} de {categories.length} categorias
                </p>
              </div>
            </div>
            {/* Desktop: vídeo à direita */}
            <div className="hidden md:block md:w-3/5 bg-black">
              <ModalVideo videoUrl={videoUrl} imageUrl={category.image_url} name={category.name} />
            </div>
          </div>
        ) : (
          /* ── Layout original: sem vídeo ── */
          <>
            <div className="relative h-72 md:h-96">
              {category.image_url ? (
                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-24 h-24 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2
                  className="text-2xl md:text-3xl font-bold text-white"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
                >
                  {category.name}
                </h2>
              </div>
            </div>
            <div className="bg-card p-6 space-y-5">
              {category.description && (
                <p className="text-foreground text-base md:text-lg leading-relaxed">{category.description}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  disabled={!hasPrev}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/categoria/${category.slug}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors text-base"
                >
                  Ver {category.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  disabled={!hasNext}
                  className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {currentIndex + 1} de {categories.length} categorias · usa ← → para navegar
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Card bento ───────────────────────────────────────────────────────────────
const CategoryCard = ({
  category,
  onOpen,
  pattern,
  desktopPattern,
  businessCount,
}: {
  category: Category;
  onOpen: () => void;
  pattern: "normal" | "wide";
  desktopPattern?: "normal" | "wide";
  businessCount?: number;
}) => {
  const IconComponent = iconMap[category.icon || "Briefcase"] || Briefcase;
  // Cards da grelha: apenas imagem, nunca vídeo
  const hasMedia = !!category.image_url;
  const isDesktopWide = desktopPattern === "wide";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
      style={{ aspectRatio: "4/3" }}
      onClick={onOpen}
    >
      {hasMedia ? (
        <>
          <div className="absolute inset-0">
            <CardMedia videoUrl={null} imageUrl={category.image_url} name={category.name} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
           <div className="relative z-10 flex flex-col justify-end h-full p-4">
            <h3
              className={`font-semibold text-white drop-shadow-md transition-transform duration-300 group-hover:-translate-y-0.5 ${
                isDesktopWide ? "text-base md:text-xl" : "text-sm md:text-base"
              }`}
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {category.name}
            </h3>
            {businessCount !== undefined && businessCount > 0 && (
              <span className="text-xs text-white/70 mt-0.5">{businessCount} negócio{businessCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </>
      ) : (
        <div className="card-category flex flex-col items-center justify-center h-full">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <IconComponent className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors text-center px-3">
            {category.name}
          </h3>
          {businessCount !== undefined && businessCount > 0 && (
            <span className="text-xs text-muted-foreground mt-1">{businessCount} negócio{businessCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Grid principal ───────────────────────────────────────────────────────────
const CategoriesGrid = ({ categories, isLoading }: CategoriesGridProps) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const { data: counts } = useCategoryCounts();

  if (isLoading) {
    return (
      <section id="categorias" className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Encontre por categoria</h2>
            <p className="text-muted-foreground text-lg">Escolha a área de negócio que procura</p>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-muted" style={{ aspectRatio: "4/3" }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="categorias" className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Encontre por categoria</h2>
            <p className="text-muted-foreground text-lg">Escolha a área de negócio que procura</p>
          </div>

          {/* Bento grid — 2 colunas mobile, 4 colunas desktop */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                pattern="normal"
                desktopPattern={BENTO[index % BENTO.length]}
                onOpen={() => setModalIndex(index)}
                businessCount={counts?.get(category.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {modalIndex !== null && (
        <CategoryModal categories={categories} initialIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </>
  );
};

export default CategoriesGrid;
