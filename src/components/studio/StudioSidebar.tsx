import { useLocation, Link } from "react-router-dom";
import { Film, ImageIcon, Clock, Settings, Zap, X, AlertTriangle } from "lucide-react";
import { useGenerations } from "@/hooks/useGenerations";
import { useBusinessAddon, getAddonStatus } from "@/hooks/useBusinessAddons";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import logoImg from "@/assets/pede-direto-logo.png";

const navItems = [
  { label: "Gerador de Reel", icon: Film, path: "/app/reel", emoji: "🎬" },
  { label: "Gerador de Imagem", icon: ImageIcon, path: "/app/image", emoji: "🖼️" },
];

const StudioSidebar = ({ onClose, selectedBusinessId }: { onClose: () => void; selectedBusinessId?: string }) => {
  const location = useLocation();
  const { data: recentGenerations } = useGenerations(3);
  const { data: addon } = useBusinessAddon(selectedBusinessId);
  const addonStatus = getAddonStatus(addon || null);

  return (
    <div className="h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link to="/app/reel" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cta flex items-center justify-center text-sm">
              📍
            </div>
            <div>
              <div className="font-display font-extrabold text-sm tracking-wide">
                PEDE<span className="text-cta">DIRETO</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Marketing AI Studio
              </div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-3 space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Ferramentas
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "hover:bg-sidebar-accent/50 text-muted-foreground"
                  )}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute right-2 w-2 h-2 rounded-full bg-cta" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Recent History */}
        {recentGenerations && recentGenerations.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Histórico recente
            </p>
            <div className="space-y-1">
              {recentGenerations.map((gen: any) => (
                <Link
                  key={gen.id}
                  to="/app/history"
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-sidebar-accent/50 transition-colors"
                >
                  <span>{gen.type === "reel" ? "🎬" : "🖼️"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sidebar-foreground">{gen.title}</div>
                    <div className="text-muted-foreground truncate">
                      {gen.subtitle} ·{" "}
                      {formatDistanceToNow(new Date(gen.created_at), {
                        addSuffix: true,
                        locale: pt,
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* History & Settings links */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Conta
          </p>
          <nav className="space-y-1">
            <Link
              to="/app/history"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === "/app/history"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50 text-muted-foreground"
              )}
            >
              <Clock className="h-4 w-4" />
              <span>Histórico</span>
            </Link>
            <Link
              to="/app/settings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === "/app/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/50 text-muted-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Definições</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Addon pill — dynamic */}
      <div className="p-3 border-t border-sidebar-border">
        {addonStatus.status === "expired" ? (
          <div className="px-3 py-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-center">
            <AlertTriangle className="h-3 w-3 inline mr-1 text-destructive" />
            <span className="text-destructive font-medium">Subscrição expirada</span>
            <span className="text-muted-foreground block mt-0.5">Contactar Pede Direto para renovar</span>
          </div>
        ) : addonStatus.status === "expiring" ? (
          <div className="px-3 py-2.5 rounded-lg border border-warning/30 bg-warning/10 text-xs text-center">
            <AlertTriangle className="h-3 w-3 inline mr-1 text-warning" />
            <span className="text-warning font-medium">{addonStatus.daysLeft} dias restantes</span>
            <span className="text-muted-foreground block mt-0.5">Contactar Pede Direto para renovar</span>
          </div>
        ) : addon?.is_trial ? (
          <div className="px-3 py-2.5 rounded-lg border border-cta/30 bg-cta/5 text-xs text-center">
            <Zap className="h-3 w-3 inline mr-1 text-cta" />
            <span className="text-cta font-medium">Trial Activo</span>
            <span className="text-muted-foreground"> · {addonStatus.daysLeft}d restantes</span>
          </div>
        ) : addonStatus.status === "active" ? (
          <div className="px-3 py-2.5 rounded-lg border border-cta/30 bg-cta/5 text-xs text-center">
            <Zap className="h-3 w-3 inline mr-1 text-cta" />
            <span className="text-cta font-medium">ADD-ON Activo</span>
            <span className="text-muted-foreground"> · Expira {addonStatus.expiresAt && format(addonStatus.expiresAt, "dd/MM/yyyy")}</span>
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-xs text-center text-muted-foreground">
            <Zap className="h-3 w-3 inline mr-1" />
            Sem add-on activo
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioSidebar;
