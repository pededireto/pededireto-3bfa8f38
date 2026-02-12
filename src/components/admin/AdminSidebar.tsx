import { Link } from "react-router-dom";
import {
  CreditCard,
  LayoutDashboard,
  Building2,
  FolderOpen,
  Star,
  ExternalLink,
  LogOut,
  Lightbulb,
  BarChart3,
  CalendarClock,
  Settings,
  FileText,
  BookOpen,
  Crown,
  SearchX,
  TrendingUp,
  Bell,
  UserCog,
  ClipboardList,
  History,
  Users,
  Inbox,
  Puzzle,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUncontactedCount } from "@/hooks/useExpirationLogs";
import { usePendingRequestsCount } from "@/hooks/useActionRequests";

export type AdminTab = "dashboard" | "businesses" | "users" | "categories" | "featured" | "plans" | "subscriptions" | "alerts" | "suggestions" | "analytics" | "search-logs" | "settings" | "pages" | "synonyms" | "commercial-users" | "action-requests" | "audit-logs" | "service-requests" | "business-modules" | "homepage" | "revenue";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  setSidebarOpen: (open: boolean) => void;
}

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "businesses", label: "Negócios", icon: Building2 },
  { id: "users", label: "Utilizadores", icon: Users },
  { id: "service-requests", label: "Pedidos", icon: Inbox },
  { id: "categories", label: "Categorias", icon: FolderOpen },
  { id: "featured", label: "Destaques", icon: Crown },
  { id: "plans", label: "Planos", icon: CreditCard },
  { id: "subscriptions", label: "Subscrições", icon: CalendarClock },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "suggestions", label: "Sugestões", icon: Lightbulb },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "search-logs", label: "Pesquisas", icon: SearchX },
  { id: "pages", label: "Páginas", icon: FileText },
  { id: "synonyms", label: "Sinónimos", icon: BookOpen },
  { id: "commercial-users", label: "Eq. Comercial", icon: UserCog },
  { id: "action-requests", label: "Pedidos Comerciais", icon: ClipboardList },
  { id: "audit-logs", label: "Auditoria", icon: History },
  { id: "business-modules", label: "Config. Ficha", icon: Puzzle },
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "revenue", label: "Receita & Crescimento", icon: TrendingUp },
  { id: "settings", label: "Configurações", icon: Settings },
];

const AdminSidebar = ({ activeTab, setActiveTab, setSidebarOpen }: AdminSidebarProps) => {
  const { signOut } = useAuth();
  const { data: uncontactedCount = 0 } = useUncontactedCount();
  const { data: pendingRequestsCount = 0 } = usePendingRequestsCount();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-sidebar-primary">
            Pede Direto
          </h1>
          <p className="text-xs text-sidebar-foreground/70">Área de Gestão</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
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
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {item.id === "alerts" && uncontactedCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {uncontactedCount}
              </span>
            )}
            {item.id === "action-requests" && pendingRequestsCount > 0 && (
              <span className="ml-auto bg-warning text-warning-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Ver site público
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
