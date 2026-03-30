import { useState } from "react";
import { Share2, MessageCircle, Link as LinkIcon, Mail, Linkedin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: "default" | "icon" | "outline";
  className?: string;
}

const SHARE_OPTIONS = (url: string, title: string, description?: string) => {
  const text = description
    ? `${title} — ${description}\n👉 ${url}`
    : `Encontrei isto no PedeDireto que pode ajudar-te:\n*${title}*\n👉 ${url}`;

  return [
    {
      label: "WhatsApp",
      icon: <MessageCircle className="h-4 w-4" />,
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Facebook",
      icon: <span className="text-sm font-bold leading-none">f</span>,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "X / Twitter",
      icon: <span className="text-sm font-bold leading-none">𝕏</span>,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "text-foreground",
    },
    {
      label: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      href: `mailto:?subject=${encodeURIComponent(title + " | PedeDireto")}&body=${encodeURIComponent(text)}`,
      color: "text-muted-foreground",
    },
  ];
};

function ShareOptionsList({ url, title, description, onCopied }: ShareButtonProps & { onCopied?: () => void }) {
  const [copied, setCopied] = useState(false);
  const options = SHARE_OPTIONS(url, title, description);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="grid gap-1">
      {options.map((opt) => (
        <a
          key={opt.label}
          href={opt.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
        >
          <span className={`w-5 h-5 flex items-center justify-center ${opt.color}`}>{opt.icon}</span>
          {opt.label}
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium w-full text-left"
      >
        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
        </span>
        {copied ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}

const ShareButton = ({ url, title, description, variant = "default", className = "" }: ShareButtonProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const triggerButton =
    variant === "icon" ? (
      <Button variant="ghost" size="icon" className={`h-8 w-8 ${className}`}>
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Partilhar</span>
      </Button>
    ) : (
      <Button variant="outline" size="sm" className={`gap-1.5 ${className}`}>
        <Share2 className="h-3.5 w-3.5" />
        Partilhar
      </Button>
    );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Partilhar</SheetTitle>
          </SheetHeader>
          <ShareOptionsList url={url} title={title} description={description} onCopied={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <ShareOptionsList url={url} title={title} description={description} onCopied={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;
