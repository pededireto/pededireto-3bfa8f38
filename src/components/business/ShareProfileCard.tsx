import { useState } from "react";
import { MessageCircle, Link as LinkIcon, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareProfileCardProps {
  slug: string;
  businessName: string;
  onShare?: () => void;
}

const SHORT_BASE = "https://pededireto.pt/p";

const ShareProfileCard = ({ slug, businessName, onShare }: ShareProfileCardProps) => {
  const [copied, setCopied] = useState(false);
  const shortUrl = `${SHORT_BASE}/${slug}`;
  const waText = `Conheça ${businessName} no Pede Direto 👉 ${shortUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Link copiado!");
      onShare?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
    onShare?.();
  };

  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">Partilhe o seu perfil</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Divulgue o link do seu negócio para atrair mais clientes.
      </p>
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
          pededireto.pt/p/{slug}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 p-1 rounded hover:bg-background transition-colors"
          aria-label="Copiar link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      <Button
        onClick={handleWhatsApp}
        className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
        size="sm"
      >
        <MessageCircle className="h-4 w-4" />
        Partilhar no WhatsApp
      </Button>
    </div>
  );
};

export default ShareProfileCard;
