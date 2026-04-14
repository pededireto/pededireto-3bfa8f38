import { Link } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  Bell,
  CreditCard,
  ExternalLink,
  LogOut,
  TrendingUp,
  Users,
  Lock,
  Star,
  Edit3,
  Award,
  ChevronDown,
  Handshake,
  Zap,
  FileText,
  MessageCircle,
} from "lucide-react";
import { useBusinessAddon, getAddonStatus } from "@/hooks/useBusinessAddons";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";
import { useBusinessUnreadRequestsCount } from "@/hooks/useBusinessDashboard";
import { Badge } from "@/components/ui/badge";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type BusinessTab =
  | "overview"
  | "requests"
  | "notifications"
  | "plan"
  | "insights"
  | "team"
  | "reviews"
  | "edit"
  | "badges"
  | "affiliates"
  | "quotes"
  | "support"
  | "job-offers";

interface BusinessSidebarProps {
  businessName: string;
  activeTab: BusinessTab;
  setActiveTab: (tab: BusinessTab) => void;
  setSidebarOpen: (open: boolean) => void;
  businessId: string;
  claimStatus?: string;
  canViewInsights?: boolean;
  canViewRequests?: boolean;
  canViewTeam?: boolean;
  isFreePlan?: boolean;
}

interface SidebarSection {
  label: string;
  items: { id: BusinessTab; label: string; icon: React.ElementType; badge?: "notifications" | "requests"; locked?: boolean; isNew?: boolean }[];
}

const BusinessSidebar = ({
  businessName,
  activeTab,
  setActiveTab,
  setSidebarOpen,
  businessId,
  claimStatus = "verified",
  canViewInsights = true,
  canViewRequests = true,
  canViewTeam = true,
  isFreePlan = false,
}: BusinessSidebarProps) => {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const { data: unreadNotifications = 0 } = useUnreadNotificationsCount(businessId);
  const { data: unreadRequests = 0 } = useBusinessUnreadRequestsCount(businessId);
  const { data: addon } = useBusinessAddon(businessId);
  const addonActive = getAddonStatus(addon || null).status !== "inactive";

  // Resolver profiles.id para o switcher
  const [profileId, setProfileId] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileId(data?.id ?? user.id));
  }, [user?.id]);

  const { list } = useUserBusinesses(profileId ?? undefined);
  const businesses = list.data || [];
  const hasMultiple = businesses.length > 1;

  const switchTo = (id: string) => {
    localStorage.setItem("activeBusinessId", id);
    qc.invalidateQueries({ queryKey: ["business-by-user"] });
    qc.invalidateQueries({ queryKey: ["business-membership"] });
    window.location.reload();
  };

  const isPending = claimStatus === "pending";

  // Build sections
  const sections: SidebarSection[] = isPending
    ? [
        {
          label: "VISÃO GERAL",
          items: [
            { id: "overview", label: "Dashboard", icon: LayoutDashboard },
            { id: "notifications", label: "Notificações", icon: Bell, badge: "notifications" },
          ],
        },
      ]
    : [
        {
          label: "VISÃO GERAL",
          items: [
            { id: "overview", label: "Dashboard", icon: LayoutDashboard },
            { id: "notifications", label: "Notificações", icon: Bell, badge: "notifications" },
          ],
        },
        {
          label: "CLIENTES",
          items: [
            ...(canViewRequests
              ? [{ id: "requests" as BusinessTab, label: "Pedidos", icon: Inbox, badge: "requests" as const }]
              : []),
            { id: "reviews", label: "Avaliações", icon: Star },
          ],
        },
        {
          label: "NEGÓCIO",
          items: [
            { id: "quotes", label: "Orçamentos", icon: FileText, isNew: true },
            { id: "job-offers", label: "Ofertas Emprego", icon: Briefcase },
            { id: "insights", label: "Insights", icon: TrendingUp, locked: isFreePlan },
          ],
        },
        {
          label: "CRESCIMENTO",
          items: [
            { id: "affiliates", label: "Indicações", icon: Handshake },
            { id: "badges", label: "Badges", icon: Award },
          ],
        },
        {
          label: "CONTA",
          items: [
            { id: "edit", label: "Editar Negócio", icon: Edit3 },
            ...(canViewTeam
              ? [{ id: "team" as BusinessTab, label: "Equipa", icon: Users }]
              : []),
            { id: "plan", label: "O Meu Plano", icon: CreditCard },
            { id: "support", label: "Suporte", icon: MessageCircle },
          ],
        },
      ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block mb-3">
          <img src={logo} alt="Pede Direto" className="h-8" />
        </Link>

        {/* Switcher de negócios */}
        {hasMultiple ? (
          <div className="relative">
            <select
              value={businessId}
              onChange={(e) => switchTo(e.target.value)}
              className="w-full text-xs bg-sidebar-accent text-sidebar-foreground border border-sidebar-border rounded-lg px-3 py-2 pr-7 appearance-none cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
            >
              {businesses.map((bu: any) => (
                <option key={bu.business_id} value={bu.business_id}>
                  {bu.business?.name}
                  {bu.role === "pending_owner" ? " (pendente)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-sidebar-foreground/50 pointer-events-none" />
          </div>
        ) : (
          <p className="text-xs text-sidebar-foreground/70 truncate">{businessName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-4 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}

                  {item.isNew && (
                    <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 border-cta/40 text-cta">
                      NOVO
                    </Badge>
                  )}

                  {item.badge === "notifications" && unreadNotifications > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {unreadNotifications}
                    </span>
                  )}
                  {item.badge === "requests" && unreadRequests > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {unreadRequests}
                    </span>
                  )}
                  {item.locked && (
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                      <Lock className="h-3 w-3 mr-0.5" /> Pro
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Marketing AI Studio */}
        {addonActive && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-4 mb-1.5">
              FERRAMENTAS
            </p>
            <Link
              to="/app/reel"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Zap className="h-4.5 w-4.5 text-cta" />
              Marketing AI
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-cta/30 text-cta">
                AI
              </Badge>
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/60">Tema</span>
          <ThemeToggle />
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> Ver site público
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
};

export default BusinessSidebar;
