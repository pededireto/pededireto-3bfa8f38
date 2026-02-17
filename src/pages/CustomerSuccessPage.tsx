import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LayoutDashboard, Ticket, Building2, BarChart3, LogOut, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import CsDashboard from "@/components/cs/CsDashboard";
import CsMetrics from "@/components/cs/CsMetrics";
import TicketsTable from "@/components/tickets/TicketsTable";

const CustomerSuccessPage = () => {
  const { user, isLoading, isCs, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão terminada");
      navigate("/");
    } catch {
      toast.error("Erro ao terminar sessão");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCs && !isAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-6">Não tens permissões de Customer Success.</p>
          <a href="/" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg">Voltar ao início</a>
        </div>
      </div>
    );
  }

  const userEmail = user?.email || "";
  const userInitials = userEmail.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">💬 Customer Success</h1>
            <p className="text-muted-foreground mt-1">Suporte e relacionamento com clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell targetRole="cs" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">Customer Success</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")}>
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Terminar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2 py-3">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-2 py-3">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Negócios</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><CsDashboard /></TabsContent>
          <TabsContent value="tickets">
            <TicketsTable department="cs" creatorRole="cs" />
          </TabsContent>
          <TabsContent value="businesses">
            <div className="bg-card rounded-xl border p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Negócios</h3>
              <p className="text-muted-foreground">Vista de negócios para CS com filtros de tickets — em desenvolvimento.</p>
            </div>
          </TabsContent>
          <TabsContent value="metrics"><CsMetrics /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerSuccessPage;
