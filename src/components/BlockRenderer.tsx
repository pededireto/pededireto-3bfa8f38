import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail } from "lucide-react";
import type { PageBlock } from "@/hooks/useInstitutionalPages";

interface BlockRendererProps {
  blocks: PageBlock[];
}

const BlockRenderer = ({ blocks }: BlockRendererProps) => {
  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <div key={block.id}>
          {block.title && (
            <h2 className="text-2xl font-bold mb-4">{block.title}</h2>
          )}
          <RenderBlock block={block} />
        </div>
      ))}
    </div>
  );
};

function RenderBlock({ block }: { block: PageBlock }) {
  const d = block.data;

  switch (block.type) {
    case "text":
      return (
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.content || "") }}
        />
      );

    case "image":
      return (
        <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          <img
            src={d.url}
            alt={d.alt || ""}
            className="max-w-full max-h-[500px] object-contain"
            loading="lazy"
          />
        </div>
      );

    case "gallery":
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(d.images || []).map((url: string, i: number) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <img src={url} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      );

    case "columns":
      return (
        <div className={`grid gap-6 ${(d.count || 2) === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {(d.columns || []).map((col: string, i: number) => (
            <div
              key={i}
              className="prose max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(col) }}
            />
          ))}
        </div>
      );

    case "icon-list":
      return (
        <ul className="space-y-3">
          {(d.items || []).map((item: { icon: string; text: string }, i: number) => (
            <li key={i} className="flex items-start gap-3 text-lg">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      );

    case "cta-button":
      return (
        <div className="flex justify-center py-2">
          <Button
            variant={d.variant === "outline" ? "outline" : d.variant === "secondary" ? "secondary" : "default"}
            size="lg"
            asChild
          >
            <a href={d.url} target={d.target || "_self"} rel={d.target === "_blank" ? "noopener noreferrer" : undefined}>
              {d.label || "Clique aqui"}
            </a>
          </Button>
        </div>
      );

    case "contacts":
      return (
        <div className="flex flex-wrap gap-4">
          {d.phone && (
            <a href={`tel:${d.phone}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Phone className="h-4 w-4" /> {d.phone}
            </a>
          )}
          {d.whatsapp && (
            <a href={`https://wa.me/${d.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {d.email && (
            <a href={`mailto:${d.email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">
              <Mail className="h-4 w-4" /> {d.email}
            </a>
          )}
        </div>
      );

    case "video": {
      const embedUrl = getEmbedUrl(d.url || "");
      if (!embedUrl) return <p className="text-muted-foreground">URL de vídeo inválida</p>;
      return (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        </div>
      );
    }

    case "separator":
      if (d.style === "space") return <div className="py-6" />;
      if (d.style === "dots") return <div className="text-center text-2xl text-muted-foreground tracking-[1em] py-4">•••</div>;
      return <hr className="border-border my-4" />;

    default:
      return null;
  }
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be")
        ? u.pathname.slice(1)
        : u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default BlockRenderer;
