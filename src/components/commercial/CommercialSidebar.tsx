import { Link } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
import {
  Building2,
  LogOut,
  ExternalLink,
  ClipboardList,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Ticket,
  MailPlus,
  Handshake,
  Target,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export type CommercialTab = "dashboard" | "pipeline" | "businesses" | "my-businesses" | "my-commissions" | "my-requests" | "claim-requests" | "tickets" | "emails" | "affiliates";

interface CommercialSidebarProps {
  activeTab: CommercialTab;
  setActiveTab: (tab: CommercialTab) => void;
  setSidebarOpen: (open: boolean) => void;
}

const sidebarItems: { id: CommercialTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "pipeline", label: "Pipeline", icon: Target },
  { id: "businesses", label: "Negócios", icon: Building2 },
  { id: "my-businesses", label: "Meus Negócios", icon: UserPlus },
  { id: "my-commissions", label: "Minhas Comissões", icon: DollarSign },
  { id: "my-requests", label: "Os Meus Pedidos", icon: ClipboardList },
  { id: "claim-requests", label: "Pedidos de Claim", icon: ShieldCheck },
  { id: "emails", label: "Email Marketing", icon: MailPlus },
  { id: "affiliates", label: "Programa de Afiliados", icon: Handshake },
  { id: "tickets", label: "Tickets", icon: Ticket },
];

const CommercialSidebar = ({ activeTab, setActiveTab, setSidebarOpen }: CommercialSidebarProps) => {
  const { signOut, isAdmin, isSuperAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <Link to="/" className="block">
          <img src={logo} alt="Pede Direto" className="h-8" />
          <p className="text-xs text-sidebar-foreground/70 mt-1">Área Comercial</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
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
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        {(isAdmin || isSuperAdmin) && (
          <Link to="/admin" className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <ExternalLink className="h-4 w-4" />
            ← Área Admin
          </Link>
        )}
        <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <ExternalLink className="h-4 w-4" />
          Ver site público
        </Link>
        <button onClick={() => signOut()} className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-destructive transition-colors w-full">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default CommercialSidebar;
