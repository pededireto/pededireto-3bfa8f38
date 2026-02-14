import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBusinessByUser } from "@/hooks/useBusinessDashboard";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import BusinessSidebar, { BusinessTab } from "@/components/business/BusinessSidebar";
import BusinessDashboardOverview from "@/components/business/BusinessDashboardOverview";
import BusinessRequestsContent from "@/components/business/BusinessRequestsContent";
import BusinessNotificationsContent from "@/components/business/BusinessNotificationsContent";
import BusinessPlanContent from "@/components/business/BusinessPlanContent";
import BusinessInsightsContent from "@/components/business/BusinessInsightsContent";
import TeamSection from "@/components/business/TeamSection";

const BusinessDashboard = () => {
  const [activeTab, setActiveTab] = useState<BusinessTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: business, isLoading } = useBusinessByUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sem negócio associado</h1>
          <p className="text-muted-foreground">A sua conta não está associada a nenhum negócio.</p>
          <Link to="/"><Button>Voltar ao início</Button></Link>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <BusinessDashboardOverview business={business} />;
      case "requests": return <BusinessRequestsContent businessId={business.id} />;
      case "notifications": return <BusinessNotificationsContent businessId={business.id} />;
      case "insights": return <BusinessInsightsContent businessId={business.id} planId={business.plan_id} />;
      case "plan": return <BusinessPlanContent business={business} />;
      case "team": return <TeamSection businessId={business.id} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/" className="text-lg font-bold text-primary">Pede Direto</Link>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <div className="flex">
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <BusinessSidebar
            businessName={business.name}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSidebarOpen={setSidebarOpen}
            businessId={business.id}
          />
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <main className="flex-1 min-h-screen p-4 md:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default BusinessDashboard;
