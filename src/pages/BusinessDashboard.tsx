import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Loader2 } from "lucide-react";
import logoImg from "@/assets/pede-direto-logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBusinessByUser } from "@/hooks/useBusinessDashboard";
import { useBusinessClaimPermissions } from "@/hooks/useBusinessClaimPermissions";
import BusinessSidebar, { BusinessTab } from "@/components/business/BusinessSidebar";
import BusinessDashboardOverview from "@/components/business/BusinessDashboardOverview";
import BusinessRequestsContent from "@/components/business/BusinessRequestsContent";
import BusinessNotificationsContent from "@/components/business/BusinessNotificationsContent";
import BusinessPlanContent from "@/components/business/BusinessPlanContent";
import BusinessInsightsContent from "@/components/business/BusinessInsightsContent";
import BusinessEditContent from "@/components/business/BusinessEditContent";
import TeamSection from "@/components/business/TeamSection";
import ClaimStatusBanner from "@/components/business/ClaimStatusBanner";
import BusinessReviewsPanel from "@/components/business/BusinessReviewsPanel";
import BadgesTab from "@/components/business/BadgesTab";
import AffiliatePortalContent from "@/components/affiliate/AffiliatePortalContent";
import BusinessQuotesContent from "@/components/business/BusinessQuotesContent";
import BusinessSupportContent from "@/components/business/BusinessSupportContent";
import BusinessJobOffersContent from "@/components/business/BusinessJobOffersContent";
import FeaturePopupManager from "@/components/business/FeaturePopupManager";
import NewBusinessOnboarding from "@/components/business/NewBusinessOnboarding";

const BusinessDashboard = () => {
  const [activeTab, setActiveTab] = useState<BusinessTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: business, isLoading } = useBusinessByUser();
  const permissions = useBusinessClaimPermissions(business);

  // Show onboarding for new businesses (no description or subcategory)
  useEffect(() => {
    if (!business) return;
    const doneKey = `new_business_onboarding_done_${business.id}`;
    const alreadyDone = localStorage.getItem(doneKey) === "true";
    if (alreadyDone) return;
    const hasDescription = ((business as any).description?.length ?? 0) >= 50;
    const hasSubcategory = !!(business as any).subcategory_id;
    if (!hasDescription || !hasSubcategory) {
      setShowOnboarding(true);
    }
  }, [business]);

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
      case "overview":
        return (
          <BusinessDashboardOverview
            business={business}
            onNavigate={(tab) => setActiveTab(tab as BusinessTab)}
          />
        );
      case "requests":
        return permissions.canViewRequests ? <BusinessRequestsContent businessId={business.id} /> : null;
      case "notifications":
        return <BusinessNotificationsContent businessId={business.id} />;
      case "insights":
        return <BusinessInsightsContent businessId={business.id} planId={business.plan_id} claimStatus={permissions.claimStatus} />;
      case "edit":
        return <BusinessEditContent business={business} />;
      case "plan":
        return <BusinessPlanContent business={business} />;
      case "team":
        return permissions.canViewTeam ? <TeamSection businessId={business.id} /> : null;
      case "reviews":
        return <BusinessReviewsPanel businessId={business.id} />;
      case "badges":
        return <BadgesTab businessId={business.id} />;
      case "affiliates":
        return <AffiliatePortalContent showBackButton backTo="/business-dashboard" />;
      case "quotes":
        return <BusinessQuotesContent businessId={business.id} />;
      case "support":
        return <BusinessSupportContent businessId={business.id} />;
      case "job-offers":
        return <BusinessJobOffersContent businessId={business.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/"><img src={logoImg} alt="Pede Direto" className="h-7" /></Link>
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
            claimStatus={permissions.claimStatus}
            canViewInsights={permissions.canViewInsights}
            canViewRequests={permissions.canViewRequests}
            canViewTeam={permissions.canViewTeam}
            isFreePlan={permissions.isFreePlan}
          />
        </aside>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1 min-h-screen p-4 md:p-8 space-y-4">
          {permissions.bannerMessage && permissions.bannerVariant && (
            <ClaimStatusBanner message={permissions.bannerMessage} variant={permissions.bannerVariant} />
          )}
          {renderContent()}
        </main>
      </div>

      {/* Feature Popup Manager — max 1 popup per session */}
      <FeaturePopupManager
        audience="business"
        onTabNavigate={(tab) => setActiveTab(tab as BusinessTab)}
      />

      {/* New Business Onboarding Form */}
      {showOnboarding && business && (
        <NewBusinessOnboarding
          business={business}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default BusinessDashboard;
