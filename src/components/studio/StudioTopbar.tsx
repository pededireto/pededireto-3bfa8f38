import { useLocation, Link } from "react-router-dom";
import { Menu, Film, ImageIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const routeMeta: Record<string, { icon: any; title: string; emoji: string }> = {
  "/app/reel": { icon: Film, title: "Gerador de Reel", emoji: "🎬" },
  "/app/image": { icon: ImageIcon, title: "Gerador de Imagem", emoji: "🖼️" },
  "/app/history": { icon: Film, title: "Histórico", emoji: "📋" },
  "/app/settings": { icon: Film, title: "Definições", emoji: "⚙️" },
};

const StudioTopbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const location = useLocation();
  const { user } = useAuth();
  const meta = routeMeta[location.pathname] || routeMeta["/app/reel"];

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  const displayName = user?.user_metadata?.full_name || user?.email || "Utilizador";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-muted">
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="mr-2">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-lg">{meta.emoji}</span>
        <span className="font-display font-semibold text-sm">{meta.title}</span>
      </div>

      <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
        IA · Gemini Pro
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <span className="text-xs font-medium hidden sm:block max-w-[120px] truncate">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
};

export default StudioTopbar;
