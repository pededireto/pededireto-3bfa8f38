import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BannerBlockProps {
  config: Record<string, any> | null;
}

const BannerBlock = ({ config }: BannerBlockProps) => {
  if (!config) return null;

  const { titulo, descricao, link, imagem_url, video_url, image_position = "direita", cta_text, bg_color = "verde" } = config;

  const isExternalLink = typeof link === "string" && /^https?:\/\//.test(link);
  const themeClass =
    bg_color === "branco"
      ? "bg-card text-foreground border border-border"
      : bg_color === "cinza"
        ? "bg-muted text-foreground"
        : bg_color === "laranja"
          ? "bg-accent text-accent-foreground"
          : bg_color === "azul"
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground";
  const hasMedia = Boolean(video_url || imagem_url);

  const getYouTubeEmbedUrl = (url: string): string => {
    const shortsMatch = url.match(/shorts\/([^?&/]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortsMatch[1]}&controls=0&playsinline=1&rel=0`;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1&rel=0`;
    return url;
  };

  const renderMedia = () => {
    if (video_url) {
      if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
        return (
          <iframe
            src={getYouTubeEmbedUrl(video_url)}
            allow="autoplay; encrypted-media"
            title={titulo || "Banner video"}
            className="h-full min-h-[220px] w-full"
            style={{ border: "none" }}
          />
        );
      }

      return <video src={video_url} className="h-full min-h-[220px] w-full object-cover" autoPlay muted loop playsInline controls={false} />;
    }

    if (!imagem_url) return null;

    return <img src={imagem_url} alt={titulo || "Banner"} className="h-full min-h-[220px] w-full object-cover" loading="lazy" />;
  };

  const renderCta = () => {
    if (!link) return null;

    const content = (
      <>
        <ExternalLink className="mr-2 h-4 w-4" />
        {cta_text || "Saber mais"}
      </>
    );

    return (
      <Button asChild variant={bg_color === "branco" || bg_color === "cinza" ? "default" : "secondary"}>
        {isExternalLink ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : (
          <Link to={link}>{content}</Link>
        )}
      </Button>
    );
  };

  const content = (
    <div className="relative z-10 max-w-2xl">
      {titulo && <h2 className="mb-3 text-2xl font-bold md:text-3xl">{titulo}</h2>}
      {descricao && <p className="mb-4 text-lg opacity-80">{descricao}</p>}
      {renderCta()}
    </div>
  );

  const media = hasMedia ? <div className="overflow-hidden rounded-2xl border border-border/20 shadow-sm">{renderMedia()}</div> : null;

  return (
    <section className="py-8">
      <div className="container">
        {image_position === "fundo" && hasMedia ? (
          <div className={`relative overflow-hidden rounded-2xl p-8 md:p-12 ${themeClass}`}>
            <div className="absolute inset-0">{renderMedia()}</div>
            <div className="absolute inset-0 bg-black/45" />
            {content}
          </div>
        ) : (
          <div className={`rounded-2xl p-8 md:p-12 ${themeClass}`}>
            <div className={`grid items-center gap-8 ${hasMedia ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {image_position === "esquerda" && media}
              {content}
              {image_position !== "esquerda" && media}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BannerBlock;
