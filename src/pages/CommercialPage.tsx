import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Loader2 } from "lucide-react";
import logoImg from "@/assets/pede-direto-logo.png";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAllBusinesses } from "@/hooks/useBusinesses";
import { useAllCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CommercialSidebar, { CommercialTab } from "@/components/commercial/CommercialSidebar";
import CommercialBusinessesContent from "@/components/commercial/CommercialBusinessesContent";
import CommercialRequestsContent from "@/components/commercial/CommercialRequestsContent";
import CommercialDashboardContent from "@/components/commercial/CommercialDashboardContent";
import CommercialMyBusinessesContent from "@/components/commercial/CommercialMyBusinessesContent";
import CommercialCommissionsContent from "@/components/commercial/CommercialCommissionsContent";
import CommercialClaimRequestsContent from "@/components/commercial/CommercialClaimRequestsContent";
import CommercialPipelineContent from "@/components/commercial/CommercialPipelineContent";
import TicketsTable from "@/components/tickets/TicketsTable";
import EmailHub from "@/components/email/EmailHub";
import AffiliatePortalContent from "@/components/affiliate/AffiliatePortalContent";

const CommercialPage = () => {
  const [activeTab, setActiveTab] = useState<CommercialTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: businesses = [], isLoading: businessesLoading } = useAllBusinesses();
  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();

  const isLoading = businessesLoading || categoriesLoading;

  const renderContent = () => {
    if (activeTab === "pipeline") return <CommercialPipelineContent />;
    if (activeTab === "my-requests") return <CommercialRequestsContent />;
    if (activeTab === "dashboard") return <CommercialDashboardContent />;
    if (activeTab === "my-businesses") return <CommercialMyBusinessesContent />;
    if (activeTab === "my-commissions") return <CommercialCommissionsContent />;
    if (activeTab === "claim-requests") return <CommercialClaimRequestsContent />;
    if (activeTab === "tickets") return <TicketsTable department="commercial" creatorRole="commercial" allowedCreateDepartments={["cs", "it_admin"]} />;
    if (activeTab === "emails") return <EmailHub />;
    if (activeTab === "affiliates") return <AffiliatePortalContent />;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">A carregar dados...</p>
          </div>
        </div>
      );
    }

    return <CommercialBusinessesContent businesses={businesses} categories={categories} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/"><img src={logoImg} alt="Pede Direto" className="h-7" /></Link>
        <div className="flex items-center gap-1">
          <NotificationBell targetRole="commercial" />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <CommercialSidebar activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CommercialPage;
