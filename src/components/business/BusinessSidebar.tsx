import { Link } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
import {
  LayoutDashboard,
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
  | "affiliates";

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

const allItems: { id: BusinessTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Pedidos", icon: Inbox },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "reviews", label: "Avaliações", icon: Star },
  { id: "team", label: "Equipa", icon: Users },
  { id: "badges", label: "Caderneta", icon: Award },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "edit", label: "Editar Negócio", icon: Edit3 },
  { id: "affiliates", label: "Afiliados", icon: Handshake },
  { id: "plan", label: "O Meu Plano", icon: CreditCard },
];

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

  const visibleItems = allItems.filter((item) => {
    if (isPending) return item.id === "overview" || item.id === "notifications";
    if (item.id === "requests" && !canViewRequests) return false;
    if (item.id === "team" && !canViewTeam) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block mb-3">
          <img src={logo} alt="Pede Direto" className="h-8" />
        </Link>

        {/* Switcher de negócios — só aparece se tiver mais de 1 */}
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

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}

            {item.id === "notifications" && unreadNotifications > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadNotifications}
              </span>
            )}
            {item.id === "requests" && unreadRequests > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadRequests}
              </span>
            )}
            {item.id === "insights" && isFreePlan && (
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                <Lock className="h-3 w-3 mr-0.5" /> Pro
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
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
