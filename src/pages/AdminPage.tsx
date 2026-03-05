import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Loader2 } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAllBusinesses } from "@/hooks/useBusinesses";
import { useAllCategories } from "@/hooks/useCategories";
import { useSuggestions } from "@/hooks/useSuggestions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AdminSidebar, { AdminTab } from "@/components/admin/AdminSidebar";
import DashboardContent from "@/components/admin/DashboardContent";
import BusinessesContent from "@/components/admin/BusinessesContent";
import CategoriesContent from "@/components/admin/CategoriesContent";
import FeaturedContent from "@/components/admin/FeaturedContent";
import SubscriptionsContent from "@/components/admin/SubscriptionsContent";
import SuggestionsContent from "@/components/admin/SuggestionsContent";
import AnalyticsContent from "@/components/admin/AnalyticsContent";
import SettingsContent from "@/components/admin/SettingsContent";
import PagesContent from "@/components/admin/PagesContent";
import SynonymsContent from "@/components/admin/SynonymsContent";
import PlansContent from "@/components/admin/PlansContent";
import SearchLogsContent from "@/components/admin/SearchLogsContent";
import AlertsContent from "@/components/admin/AlertsContent";
import TeamManagement from "@/components/admin/TeamManagement";
import ActionRequestsContent from "@/components/admin/ActionRequestsContent";
import AuditLogsContent from "@/components/admin/AuditLogsContent";
import UsersContent from "@/components/admin/UsersContent";
import ServiceRequestsContent from "@/components/admin/ServiceRequestsContent";
import BusinessModulesContent from "@/components/admin/BusinessModulesContent";
import HomepageContent from "@/components/admin/HomepageContent";
import RevenueDashboardContent from "@/components/admin/RevenueDashboardContent";
import PerformanceContent from "@/components/admin/PerformanceContent";
import CommissionModelsContent from "@/components/admin/CommissionModelsContent";
import CommissionAuditContent from "@/components/admin/CommissionAuditContent";
import LeadsDashboardContent from "@/components/admin/LeadsDashboardContent";
import IntelligenceCenterContent from "@/components/admin/IntelligenceCenterContent";
import ClaimRequestsContent from "@/components/admin/ClaimRequestsContent";
import TicketsTable from "@/components/tickets/TicketsTable";
import AdminReviewsPanel from "@/components/admin/AdminReviewsPanel";
import TestUsersPanel from "@/components/admin/TestUsersPanel";
import PendingClaimsPanel from "@/components/admin/PendingClaimsPanel";
import EmailHub from "@/components/email/EmailHub";
import BlogContent from "@/components/admin/BlogContent";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: businesses = [], isLoading: businessesLoading } = useAllBusinesses();
  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestions();

  const isLoading = businessesLoading || categoriesLoading || suggestionsLoading;

  const renderContent = () => {
    // These tabs don't depend on businesses/categories data
    if (activeTab === "analytics") return <AnalyticsContent />;
    if (activeTab === "settings") return <SettingsContent />;
    if (activeTab === "pages") return <PagesContent />;
    if (activeTab === "synonyms") return <SynonymsContent />;
    if (activeTab === "plans") return <PlansContent />;
    if (activeTab === "search-logs") return <SearchLogsContent />;
    if (activeTab === "alerts") return <AlertsContent />;
    if (activeTab === "team-management") return <TeamManagement />;
    if (activeTab === "action-requests") return <ActionRequestsContent />;
    if (activeTab === "audit-logs") return <AuditLogsContent />;
    if (activeTab === "users") return <UsersContent />;
    if (activeTab === "service-requests") return <ServiceRequestsContent />;
    if (activeTab === "business-modules") return <BusinessModulesContent />;
    if (activeTab === "homepage") return <HomepageContent />;
    if (activeTab === "revenue") return <RevenueDashboardContent />;
    if (activeTab === "performance") return <PerformanceContent />;
    if (activeTab === "commission-models") return <CommissionModelsContent />;
    if (activeTab === "commission-audit") return <CommissionAuditContent />;
    if (activeTab === "leads-dashboard") return <LeadsDashboardContent />;
    if (activeTab === "intelligence") return <IntelligenceCenterContent />;
    if (activeTab === "claim-requests") return <ClaimRequestsContent />;
    if (activeTab === "tickets") return <TicketsTable showAll creatorRole="admin" />;
    if (activeTab === "reviews") return <AdminReviewsPanel />;
    if (activeTab === "test-users") return <TestUsersPanel />;
    if (activeTab === "pending-claims") return <PendingClaimsPanel />;
    if (activeTab === "emails") return <EmailHub showInbox />;
    if (activeTab === "blog") return <BlogContent />;

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

    switch (activeTab) {
      case "dashboard":
        return <DashboardContent businesses={businesses} categories={categories} suggestions={suggestions} />;
      case "businesses":
        return <BusinessesContent businesses={businesses} categories={categories} />;
      case "categories":
        return <CategoriesContent categories={categories} businesses={businesses} />;
      case "featured":
        return <FeaturedContent businesses={businesses} />;
      case "subscriptions":
        return <SubscriptionsContent businesses={businesses} />;
      case "suggestions":
        return <SuggestionsContent suggestions={suggestions} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/" className="text-lg font-bold text-primary">
          Pede Direto
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell targetRole="admin" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSidebarOpen={setSidebarOpen}
          />
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
