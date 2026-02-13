import { Link } from "react-router-dom";
import { LayoutDashboard, Inbox, Bell, CreditCard, ExternalLink, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useBusinessNotifications";

export type BusinessTab = "overview" | "requests" | "notifications" | "plan" | "insights";

interface BusinessSidebarProps {
  businessName: string;
  activeTab: BusinessTab;
  setActiveTab: (tab: BusinessTab) => void;
  setSidebarOpen: (open: boolean) => void;
  businessId: string;
}

const items: { id: BusinessTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Pedidos", icon: Inbox },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "plan", label: "O Meu Plano", icon: CreditCard },
];

const BusinessSidebar = ({ businessName, activeTab, setActiveTab, setSidebarOpen, businessId }: BusinessSidebarProps) => {
  const { signOut } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(businessId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-sidebar-primary">Pede Direto</h1>
          <p className="text-xs text-sidebar-foreground/70 truncate">{businessName}</p>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.id === "notifications" && unreadCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <ExternalLink className="h-4 w-4" /> Ver site público
        </Link>
        <button onClick={() => signOut()} className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
};

export default BusinessSidebar;
