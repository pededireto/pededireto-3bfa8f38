import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Users, Building2, Link2, Bug } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OnboardingDashboard from "@/components/onboarding/OnboardingDashboard";
import OnboardingUsers from "@/components/onboarding/OnboardingUsers";
import OnboardingBusinesses from "@/components/onboarding/OnboardingBusinesses";
import OnboardingConnections from "@/components/onboarding/OnboardingConnections";
import OnboardingBugReports from "@/components/onboarding/OnboardingBugReports";

const OnboardingPage = () => {
  const { isLoading, isOnboarding } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOnboarding) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">🎯 Onboarding Team</h1>
          <p className="text-muted-foreground">Gestão de utilizadores e negócios</p>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Utilizadores
            </TabsTrigger>
            <TabsTrigger value="businesses">
              <Building2 className="h-4 w-4 mr-2" />
              Negócios
            </TabsTrigger>
            <TabsTrigger value="connections">
              <Link2 className="h-4 w-4 mr-2" />
              Ligações
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4 mr-2" />
              Bugs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <OnboardingDashboard />
          </TabsContent>

          <TabsContent value="users">
            <OnboardingUsers />
          </TabsContent>

          <TabsContent value="businesses">
            <OnboardingBusinesses />
          </TabsContent>

          <TabsContent value="connections">
            <OnboardingConnections />
          </TabsContent>

          <TabsContent value="bugs">
            <OnboardingBugReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OnboardingPage;
