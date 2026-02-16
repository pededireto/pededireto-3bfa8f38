import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LayoutDashboard, Ticket, Building2, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerSuccessPage = () => {
  const { isLoading, isCs, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

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
          <p className="text-muted-foreground mb-6">
            Não tens permissões de Customer Success.
          </p>
          <a href="/" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold">💬 Customer Success</h1>
          <p className="text-muted-foreground mt-1">Suporte e relacionamento com clientes</p>
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

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-2">📊 Visão Geral</h3>
                <p className="text-muted-foreground text-sm">Dashboard com métricas de suporte virá aqui.</p>
              </div>
              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-2">🎯 Prioridades</h3>
                <p className="text-muted-foreground text-sm">Negócios que precisam de atenção virão aqui.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="bg-card rounded-xl border p-8 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Sistema de Tickets</h3>
              <p className="text-muted-foreground">Em desenvolvimento. Será possível gerir tickets de suporte aqui.</p>
            </div>
          </TabsContent>

          <TabsContent value="businesses">
            <div className="bg-card rounded-xl border p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Negócios</h3>
              <p className="text-muted-foreground">Vista de negócios para CS virá aqui.</p>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="bg-card rounded-xl border p-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Métricas</h3>
              <p className="text-muted-foreground">Métricas de satisfação, churn, NPS, etc. virão aqui.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerSuccessPage;
