import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
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
  | "emails"
  | "blog";

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

// Estrutura estática dos grupos (sem badges — esses são injectados dinamicamente)
const SIDEBAR_STRUCTURE: Omit<SidebarItem, "badge">[][] = [
  // 0 - overview (1 item)
  [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  // 1 - negocios
  [
    { id: "businesses", label: "Negócios", icon: Building2 },
    { id: "claim-requests", label: "Pedidos de Claim", icon: ShieldCheck },
    { id: "pending-claims", label: "Reclamações Comerciais", icon: FileCheck },
    { id: "business-modules", label: "Config. Ficha", icon: Puzzle },
    { id: "featured", label: "Destaques", icon: Crown },
    { id: "reviews", label: "Avaliações", icon: Star },
  ],
  // 2 - utilizadores
  [
    { id: "users", label: "Utilizadores", icon: Users },
    { id: "team-management", label: "Equipa Pede Direto", icon: UserCog },
    { id: "test-users", label: "BOTs de Teste", icon: Bot },
  ],
  // 3 - pedidos
  [
    { id: "service-requests", label: "Pedidos", icon: Inbox },
    { id: "leads-dashboard", label: "Dashboard Leads", icon: Target },
    { id: "action-requests", label: "Pedidos Comerciais", icon: ClipboardList },
    { id: "tickets", label: "Tickets", icon: Ticket },
  ],
  // 4 - receita
  [
    { id: "plans", label: "Planos", icon: CreditCard },
    { id: "subscriptions", label: "Subscrições", icon: CalendarClock },
    { id: "revenue", label: "Receita & Crescimento", icon: TrendingUp },
    { id: "commission-models", label: "Modelos Comissão", icon: Coins },
    { id: "commission-audit", label: "Auditoria Comissões", icon: ShieldCheck },
  ],
  // 5 - analytics
  [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "performance", label: "Performance Comercial", icon: Handshake },
    { id: "intelligence", label: "Intelligence Center", icon: Brain },
    { id: "search-logs", label: "Pesquisas", icon: SearchX },
  ],
  // 6 - conteudo
  [
    { id: "categories", label: "Categorias", icon: FolderOpen },
    { id: "pages", label: "Páginas", icon: FileText },
    { id: "synonyms", label: "Sinónimos", icon: BookOpen },
    { id: "homepage", label: "Homepage", icon: Home },
    { id: "blog", label: "Blog", icon: BookOpen },
  ],
  // 7 - comunicacao
  [
    { id: "alerts", label: "Alertas", icon: Bell },
    { id: "suggestions", label: "Sugestões", icon: Lightbulb },
    { id: "emails", label: "Email Marketing", icon: MailPlus },
  ],
  // 8 - sistema
  [
    { id: "audit-logs", label: "Auditoria", icon: History },
    { id: "settings", label: "Configurações", icon: Settings },
  ],
];

const GROUP_META: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "negocios", label: "Negócios", icon: Building2 },
  { id: "utilizadores", label: "Utilizadores", icon: Users },
  { id: "pedidos", label: "Pedidos & Leads", icon: Inbox },
  { id: "receita", label: "Receita", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "conteudo", label: "Conteúdo", icon: FileText },
  { id: "comunicacao", label: "Comunicação", icon: Bell },
  { id: "sistema", label: "Sistema", icon: Settings },
];

// Hook para tickets não lidos
const useUnreadTicketsCount = () => {
  return useQuery({
    queryKey: ["admin-unread-tickets"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("ticket_notifications")
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

  // Badges por index de grupo (corresponde a SIDEBAR_STRUCTURE)
  const badgeMap: Record<AdminTab, number> = {
    "claim-requests": pendingClaimsCount,
    "action-requests": pendingRequestsCount,
    tickets: unreadTickets,
    alerts: uncontactedCount,
  } as Record<AdminTab, number>;

  // Construir grupos com badges injectados
  const sidebarGroups: SidebarGroup[] = GROUP_META.map((meta, i) => ({
    ...meta,
    items: SIDEBAR_STRUCTURE[i].map((item) => ({
      ...item,
      badge: badgeMap[item.id] || 0,
    })),
  }));

  // Grupo activo por defeito
  const activeGroupId = sidebarGroups.find((g) => g.items.some((i) => i.id === activeTab))?.id || "overview";
  const [openGroups, setOpenGroups] = useState<string[]>([activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <img src={logo} alt="Pede Direto" className="h-8" />
          <p className="text-xs text-sidebar-foreground/70 mt-1">Área de Gestão</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarGroups.map((group) => {
          const isOpen = openGroups.includes(group.id);
          const groupBadge = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);
          const hasActiveItem = group.items.some((i) => i.id === activeTab);

          // Grupo com 1 item — sem colapso
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

              {/* Itens */}
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
