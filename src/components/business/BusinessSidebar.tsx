import { Link } from "react-router-dom";
import { LayoutDashboard, Inbox, Bell, CreditCard, ExternalLink, LogOut, TrendingUp, Users, Lock, Star, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";
import { useBusinessUnreadRequestsCount } from "@/hooks/useBusinessDashboard";
import { Badge } from "@/components/ui/badge";

export type BusinessTab = "overview" | "requests" | "notifications" | "plan" | "insights" | "team" | "reviews" | "edit";

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
  { id: "overview",      label: "Dashboard",      icon: LayoutDashboard },
  { id: "requests",      label: "Pedidos",         icon: Inbox },
  { id: "notifications", label: "Notificações",    icon: Bell },
  { id: "reviews",       label: "Avaliações",      icon: Star },
  { id: "team",          label: "Equipa",          icon: Users },
  { id: "insights",      label: "Insights",        icon: TrendingUp },
  { id: "edit",          label: "Editar Negócio",  icon: Edit3 },
  { id: "plan",          label: "O Meu Plano",     icon: CreditCard },
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
  const { signOut } = useAuth();
  const { data: unreadNotifications = 0 } = useUnreadNotificationsCount(businessId);
  const { data: unreadRequests = 0 }      = useBusinessUnreadRequestsCount(businessId);

  const isPending = claimStatus === "pending";

  const visibleItems = allItems.filter((item) => {
    if (isPending) {
      return item.id === "overview" || item.id === "notifications";
    }
    if (item.id === "requests" && !canViewRequests) return false;
    if (item.id === "team"     && !canViewTeam)     return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-sidebar-primary">Pede Direto</h1>
          <p className="text-xs text-sidebar-foreground/70 truncate">{businessName}</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}

            {/* Badge — Notificações */}
            {item.id === "notifications" && unreadNotifications > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadNotifications}
              </span>
            )}

            {/* Badge — Pedidos com mensagens não lidas */}
            {item.id === "requests" && unreadRequests > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadRequests}
              </span>
            )}

            {/* Badge — Insights bloqueado */}
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
