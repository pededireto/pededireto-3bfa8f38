import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Building2, Link2, Bug, LayoutDashboard, LogOut, User, Ticket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import OnboardingDashboard from "@/components/onboarding/OnboardingDashboard";
import OnboardingUsers from "@/components/onboarding/OnboardingUsers";
import OnboardingBusinesses from "@/components/onboarding/OnboardingBusinesses";
import OnboardingConnections from "@/components/onboarding/OnboardingConnections";
import OnboardingBugReports from "@/components/onboarding/OnboardingBugReports";
import TicketsTable from "@/components/tickets/TicketsTable";

const OnboardingPage = () => {
  const { user, isLoading, isOnboarding, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão terminada");
      navigate("/");
    } catch (error: any) {
      console.error("[OnboardingPage] logout error:", error);
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

  if (!isOnboarding && !isAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-6">
            Não tens permissões de Onboarding.
          </p>
          <a href="/" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg">
            Voltar ao início
          </a>
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
            <h1 className="text-3xl font-bold">🎯 Onboarding Team</h1>
            <p className="text-muted-foreground mt-1">Gestão de utilizadores e negócios da plataforma</p>
          </div>

          <div className="flex items-center gap-3">
            {(isAdmin || isSuperAdmin) && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                ← Admin
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Onboarding Team</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")}>
                  <User className="mr-2 h-4 w-4" /> <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> <span>Terminar Sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilizadores</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex items-center gap-2 py-3">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Negócios</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2 py-3">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Ligações</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2 py-3">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="bugs" className="flex items-center gap-2 py-3">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Bugs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><OnboardingDashboard /></TabsContent>
          <TabsContent value="users"><OnboardingUsers /></TabsContent>
          <TabsContent value="businesses"><OnboardingBusinesses /></TabsContent>
          <TabsContent value="connections"><OnboardingConnections /></TabsContent>
          <TabsContent value="tickets">
            <TicketsTable department="onboarding" creatorRole="onboarding" allowedCreateDepartments={["cs", "it_admin"]} />
          </TabsContent>
          <TabsContent value="bugs"><OnboardingBugReports /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OnboardingPage;
