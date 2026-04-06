import { useState, useRef, useEffect } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface OgData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

interface InstagramLinkPreviewProps {
  handle: string;
  ogData?: OgData | null;
  url: string;
  onCtaClick?: () => void;
}

const InstagramLinkPreview = ({ handle, ogData, url, onCtaClick }: InstagramLinkPreviewProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate position
  useEffect(() => {
    if (showPreview && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      setPosition(spaceAbove < 300 ? "bottom" : "top");
    }
  }, [showPreview]);

  // Close on Escape
  useEffect(() => {
    if (!showPreview) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPreview(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showPreview]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!showPreview) return;
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowPreview(false);
      }
    };
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showPreview]);

  if (!ogData) {
    // Simple link without preview
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onCtaClick?.()}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#E1306C] transition-colors"
      >
        <Instagram className="w-4 h-4" />
        @{handle}
      </a>
    );
  }

  const handleClick = () => {
    onCtaClick?.();
    window.open(url, "_blank");
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onFocus={() => setShowPreview(true)}
        onBlur={() => setShowPreview(false)}
        onTouchStart={() => {
          longPressTimer.current = setTimeout(() => setShowPreview(true), 500);
        }}
        onTouchEnd={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }}
        onClick={handleClick}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#E1306C] transition-colors cursor-pointer"
        aria-label={`Ver perfil de Instagram @${handle}`}
      >
        <Instagram className="w-4 h-4" />
        @{handle}
      </button>

      {showPreview && (
        <div
          ref={previewRef}
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-50 w-[280px] rounded-xl border border-border bg-card shadow-lg",
            "animate-in fade-in slide-in-from-bottom-1 duration-200",
            position === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
          role="tooltip"
        >
          {/* Instagram gradient header */}
          <div className="h-16 rounded-t-xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] relative">
            {/* Avatar */}
            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-full border-[3px] border-card overflow-hidden bg-muted">
                {ogData.avatarUrl ? (
                  <img src={ogData.avatarUrl} alt={ogData.name || handle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#833AB4] to-[#E1306C] text-white text-lg font-bold">
                    {(ogData.name || handle).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 px-4 pb-4 space-y-2">
            {/* Origin */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#E1306C]" />
              instagram.com
            </div>

            {/* Name & handle */}
            <div>
              {ogData.name && <p className="text-sm font-semibold text-foreground">{ogData.name}</p>}
              <p className="text-xs text-muted-foreground">@{handle}</p>
            </div>

            {/* Bio */}
            {ogData.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{ogData.bio}</p>
            )}

            {/* CTA */}
            <button
              onClick={handleClick}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3 h-3" />
              Ver no Instagram
            </button>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border border-border bg-card",
              position === "top"
                ? "bottom-[-7px] border-l-0 border-t-0"
                : "top-[-7px] border-r-0 border-b-0"
            )}
          />
        </div>
      )}
    </div>
  );
};

export default InstagramLinkPreview;
