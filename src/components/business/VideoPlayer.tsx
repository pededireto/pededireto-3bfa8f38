import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  label?: string;
}

function getEmbedInfo(url: string): {
  type: "youtube" | "vimeo" | "facebook" | "direct" | "instagram" | "unknown";
  embedUrl: string;
} {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    // ── CORRIGIDO: playsinline=0 força fullscreen nativo no Android/iOS ──
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?playsinline=0&rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Facebook — Reels, vídeos, watch
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    const encoded = encodeURIComponent(url);
    return {
      type: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=560&autoplay=false`,
    };
  }

  // Instagram — não suporta embed via iframe
  if (url.includes("instagram.com")) {
    return { type: "instagram", embedUrl: url };
  }

  // Ficheiro de vídeo directo (mp4, webm, mov, etc.)
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url)) {
    return { type: "direct", embedUrl: url };
  }

  return { type: "unknown", embedUrl: url };
}

const VideoPlayer = ({ url, label }: VideoPlayerProps) => {
  const [error, setError] = useState(false);
  const [unknownVideoFailed, setUnknownVideoFailed] = useState(false);

  if (!url?.trim()) return null;

  const { type, embedUrl } = getEmbedInfo(url);

  return (
    <div>
      {label && <span className="text-sm font-medium block mb-2">{label}</span>}

      {/* YouTube / Vimeo */}
      {(type === "youtube" || type === "vimeo") && !error && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            // ── CORRIGIDO: fullscreen + orientation para rotação no Android ──
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            title={label || "Vídeo"}
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setError(true)}
          />
        </div>
      )}

      {/* Facebook */}
      {type === "facebook" && !error && (
        <div className="rounded-lg overflow-hidden bg-muted">
          <iframe
            src={embedUrl}
            className="w-full"
            style={{ height: "476px", border: "none", overflow: "hidden" }}
            scrolling="no"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title={label || "Vídeo Facebook"}
            onError={() => setError(true)}
          />
        </div>
      )}

      {/* Ficheiro directo mp4/webm */}
      {type === "direct" && !error && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={embedUrl}
            controls
            playsInline={false}
            className="w-full h-full object-contain"
            onError={() => setError(true)}
          >
            O teu browser não suporta este formato de vídeo.
          </video>
        </div>
      )}

      {/* URL desconhecida — tentar como vídeo directo, fallback para link */}
      {type === "unknown" && !error && !unknownVideoFailed && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={embedUrl}
            controls
            playsInline={false}
            className="w-full h-full object-contain"
            onError={() => setUnknownVideoFailed(true)}
          >
            O teu browser não suporta este formato de vídeo.
          </video>
        </div>
      )}

      {/* Instagram ou fallback final */}
      {(type === "instagram" || error || (type === "unknown" && unknownVideoFailed)) && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm text-primary"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {label ? `Ver ${label}` : "Ver vídeo"}
          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">{url}</span>
        </a>
      )}
    </div>
  );
};

export default VideoPlayer;
