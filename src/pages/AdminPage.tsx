import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Loader2 } from "lucide-react";
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

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: businesses = [], isLoading: businessesLoading } = useAllBusinesses();
  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestions();

  const isLoading = businessesLoading || categoriesLoading || suggestionsLoading;

  const renderContent = () => {
    if (isLoading && activeTab !== "analytics") {
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
      case "analytics":
        return <AnalyticsContent />;
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
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

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)] p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
