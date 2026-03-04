import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  label?: string;
}

function getEmbedInfo(url: string): { type: "youtube" | "external" | "direct"; embedUrl: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "youtube", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Ficheiro de vídeo directo (mp4, webm, mov, etc.)
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url)) {
    return { type: "direct", embedUrl: url };
  }

  // Facebook, Instagram, TikTok, Supabase Storage — abrir externamente
  return { type: "external", embedUrl: url };
}

const VideoPlayer = ({ url, label }: VideoPlayerProps) => {
  const [error, setError] = useState(false);

  if (!url?.trim()) return null;

  const { type, embedUrl } = getEmbedInfo(url);

  return (
    <div>
      {label && <span className="text-sm font-medium block mb-1">{label}</span>}

      {type === "youtube" && !error && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={label || "Vídeo"}
            onError={() => setError(true)}
          />
        </div>
      )}

      {type === "direct" && !error && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={embedUrl}
            controls
            className="w-full h-full object-contain"
            onError={() => setError(true)}
          >
            O teu browser não suporta este formato de vídeo.
          </video>
        </div>
      )}

      {(type === "external" || error) && (
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
