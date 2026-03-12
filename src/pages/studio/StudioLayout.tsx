import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu, X } from "lucide-react";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";
import { cn } from "@/lib/utils";

const StudioLayout = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] flex-shrink-0 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <StudioSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <StudioTopbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StudioLayout;
