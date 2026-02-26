import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  LayoutDashboard,
  MailPlus,
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
  Home,
  Handshake,
  Coins,
  ShieldCheck,
  Target,
  Brain,
  Ticket,
  Bot,
  FileCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUncontactedCount } from "@/hooks/useExpirationLogs";
import { usePendingRequestsCount } from "@/hooks/useActionRequests";
import { usePendingClaimsCount } from "@/hooks/useClaimRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminTab =
  | "dashboard"
  | "businesses"
  | "users"
  | "categories"
  | "featured"
  | "plans"
  | "subscriptions"
  | "alerts"
  | "suggestions"
  | "analytics"
  | "search-logs"
  | "settings"
  | "pages"
  | "synonyms"
  | "team-management"
  | "action-requests"
  | "audit-logs"
  | "service-requests"
  | "business-modules"
  | "homepage"
  | "revenue"
  | "performance"
  | "commission-models"
  | "commission-audit"
  | "leads-dashboard"
  | "intelligence"
  | "claim-requests"
  | "tickets"
  | "reviews"
  | "test-users"
  | "pending-claims"
  | "emails";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  setSidebarOpen: (open: boolean) => void;
}

interface SidebarItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

// Hook para contar tickets não lidos
const useUnreadTicketsCount = () => {
  return useQuery({
    queryKey: ["admin-unread-tickets"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase
        .from("ticket_notifications" as any)
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      return count || 0;
    },
  });
};

const AdminSidebar = ({ activeTab, setActiveTab, setSidebarOpen }: AdminSidebarProps) => {
  const { signOut } = useAuth();
  const { data: uncontactedCount = 0 } = useUncontactedCount();
  const { data: pendingRequestsCount = 0 } = usePendingRequestsCount();
  const { data: pendingClaimsCount = 0 } = usePendingClaimsCount();
  const { data: unreadTickets = 0 } = useUnreadTicketsCount();

  // Grupos abertos por defeito — o que contém o tab activo abre automaticamente
  const getDefaultOpen = () => {
    const groupOfActive = sidebarGroups.find((g) => g.items.some((i) => i.id === activeTab));
    return groupOfActive ? [groupOfActive.id] : ["overview"];
  };

  const [openGroups, setOpenGroups] = useState<string[]>(getDefaultOpen);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  const sidebarGroups: SidebarGroup[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      id: "negocios",
      label: "Negócios",
      icon: Building2,
      items: [
        { id: "businesses", label: "Negócios", icon: Building2 },
        { id: "claim-requests", label: "Pedidos de Claim", icon: ShieldCheck, badge: pendingClaimsCount },
        { id: "pending-claims", label: "Reclamações Comerciais", icon: FileCheck },
        { id: "business-modules", label: "Config. Ficha", icon: Puzzle },
        { id: "featured", label: "Destaques", icon: Crown },
        { id: "reviews", label: "Avaliações", icon: Star },
      ],
    },
    {
      id: "utilizadores",
      label: "Utilizadores",
      icon: Users,
      items: [
        { id: "users", label: "Utilizadores", icon: Users },
        { id: "team-management", label: "Equipa Pede Direto", icon: UserCog },
        { id: "test-users", label: "BOTs de Teste", icon: Bot },
      ],
    },
    {
      id: "pedidos",
      label: "Pedidos & Leads",
      icon: Inbox,
      items: [
        { id: "service-requests", label: "Pedidos", icon: Inbox },
        { id: "leads-dashboard", label: "Dashboard Leads", icon: Target },
        { id: "action-requests", label: "Pedidos Comerciais", icon: ClipboardList, badge: pendingRequestsCount },
        { id: "tickets", label: "Tickets", icon: Ticket, badge: unreadTickets },
      ],
    },
    {
      id: "receita",
      label: "Receita",
      icon: CreditCard,
      items: [
        { id: "plans", label: "Planos", icon: CreditCard },
        { id: "subscriptions", label: "Subscrições", icon: CalendarClock },
        { id: "revenue", label: "Receita & Crescimento", icon: TrendingUp },
        { id: "commission-models", label: "Modelos Comissão", icon: Coins },
        { id: "commission-audit", label: "Auditoria Comissões", icon: ShieldCheck },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "performance", label: "Performance Comercial", icon: Handshake },
        { id: "intelligence", label: "Intelligence Center", icon: Brain },
        { id: "search-logs", label: "Pesquisas", icon: SearchX },
      ],
    },
    {
      id: "conteudo",
      label: "Conteúdo",
      icon: FileText,
      items: [
        { id: "categories", label: "Categorias", icon: FolderOpen },
        { id: "pages", label: "Páginas", icon: FileText },
        { id: "synonyms", label: "Sinónimos", icon: BookOpen },
        { id: "homepage", label: "Homepage", icon: Home },
      ],
    },
    {
      id: "comunicacao",
      label: "Comunicação",
      icon: Bell,
      items: [
        { id: "alerts", label: "Alertas", icon: Bell, badge: uncontactedCount },
        { id: "suggestions", label: "Sugestões", icon: Lightbulb },
        { id: "emails", label: "Email Marketing", icon: MailPlus },
      ],
    },
    {
      id: "sistema",
      label: "Sistema",
      icon: Settings,
      items: [
        { id: "audit-logs", label: "Auditoria", icon: History },
        { id: "settings", label: "Configurações", icon: Settings },
      ],
    },
  ];

  // Badge total para cada grupo (soma dos badges dos filhos)
  const getGroupBadge = (group: SidebarGroup) => group.items.reduce((sum, item) => sum + (item.badge || 0), 0);

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <h1 className="text-xl font-bold text-sidebar-primary">Pede Direto</h1>
          <p className="text-xs text-sidebar-foreground/70">Área de Gestão</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarGroups.map((group) => {
          const isOpen = openGroups.includes(group.id);
          const groupBadge = getGroupBadge(group);
          const hasActiveItem = group.items.some((i) => i.id === activeTab);

          // Grupo com apenas 1 item — mostrar directamente sem colapso
          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {(item.badge || 0) > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <div key={group.id}>
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  hasActiveItem
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <group.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {/* Badge do grupo quando fechado */}
                {!isOpen && groupBadge > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                    {groupBadge}
                  </span>
                )}
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </button>

              {/* Itens do grupo */}
              {isOpen && (
                <div className="ml-3 pl-3 border-l border-sidebar-border/50 mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        activeTab === item.id
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {(item.badge || 0) > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          onClick={signOut}
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
