import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfflineIndicator from "@/components/OfflineIndicator";
import EmergencyBanner from "@/components/EmergencyBanner";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";

import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import BusinessPage from "./pages/BusinessPage";
import InstitutionalPage from "./pages/InstitutionalPage";

import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import RegisterChoice from "./pages/RegisterChoice";
import RegisterBusiness from "./pages/RegisterBusiness";
import ClaimBusiness from "./pages/ClaimBusiness";

import UserDashboard from "./pages/UserDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import ProfilePage from "./pages/ProfilePage";

import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import CommercialPage from "./pages/CommercialPage";

import RequestServicePage from "./pages/RequestServicePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "page_view", {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
};

const App = () => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () =>
      window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <EmergencyBanner />

              <BrowserRouter>
                <RouteTracker />
                <ScrollToTop />

                <Routes>
                  {/* PUBLIC */}
                  <Route path="/" element={<Index />} />
                  <Route path="/categoria/:slug" element={<CategoryPage />} />
                  <Route
                    path="/categoria/:categorySlug/:subcategorySlug"
                    element={<SubcategoryPage />}
                  />
                  <Route path="/negocio/:slug" element={<BusinessPage />} />
                  <Route path="/pagina/:slug" element={<InstitutionalPage />} />

                  {/* AUTH */}
                  <Route path="/login" element={<UserLogin />} />

                  {/* NEW CLEAN REGISTER STRUCTURE */}
                  <Route path="/register" element={<RegisterChoice />} />
                  <Route path="/register/user" element={<UserRegister />} />
                  <Route path="/register/business" element={<RegisterBusiness />} />

                  {/* CLAIM FLOW */}
                  <Route path="/claim-business" element={<ClaimBusiness />} />

                  {/* DASHBOARDS */}
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/business-dashboard" element={<BusinessDashboard />} />
                  <Route path="/perfil" element={<ProfilePage />} />

                  {/* ADMIN */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/register" element={<AdminRegister />} />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/comercial"
                    element={
                      <ProtectedRoute requireCommercial>
                        <CommercialPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* SERVICES */}
                  <Route path="/pedir-servico" element={<RequestServicePage />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                <CookieConsent />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
