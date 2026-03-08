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
import SessionExpiredModal from "@/components/SessionExpiredModal";

import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import SubcategoryCityPage from "./pages/SubcategoryCityPage";
import BusinessPage from "./pages/BusinessPage";
import InstitutionalPage from "./pages/InstitutionalPage";

import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import RegisterChoice from "./pages/RegisterChoice";
import RegisterBusiness from "./pages/RegisterBusiness";
import ClaimBusiness from "./pages/ClaimBusiness";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserProfile from "./pages/UserProfile";

import UserDashboard from "./pages/UserDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import ProfilePage from "./pages/ProfilePage";

import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import CommercialPage from "./pages/CommercialPage";
import OnboardingPage from "./pages/OnboardingPage";
import CustomerSuccessPage from "./pages/CustomerSuccessPage";

import RequestServicePage from "./pages/RequestServicePage";
import RequestDetailPage from "./pages/RequestDetailPage";
import UpgradePage from "./pages/UpgradePage";
import SearchPage from "./pages/SearchPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import TopRankingPage from "./pages/TopRankingPage";
import BusinessShortUrl from "./pages/BusinessShortUrl";
import NotFound from "./pages/NotFound";
import StripeSetup from "./pages/admin/StripeSetup";
import StripeCleanup from "./pages/admin/StripeCleanup";

const queryClient = new QueryClient();

/* =========================
   ROUTE TRACKING (Analytics)
========================= */
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

/* =========================
   ACCESSIBILITY:
   Move focus to <main> when route changes
========================= */
const RouteFocusHandler = () => {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.focus();
    }
  }, [location.pathname]);

  return null;
};

const App = () => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () => window.removeEventListener("unhandledrejection", handleRejection);
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
                <RouteFocusHandler />
                <ScrollToTop />
                <SessionExpiredModal />

                {/* ✅ SKIP LINK (primeiro elemento focável real da página) */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
                >
                  Saltar para o conteúdo principal
                </a>

                {/* ✅ MAIN LANDMARK */}
                <main id="main-content" tabIndex={-1}>
                  <Routes>
                    {/* PUBLIC */}
                    <Route path="/" element={<Index />} />
                    <Route path="/categoria/:slug" element={<CategoryPage />} />
                    <Route path="/categoria/:categorySlug/:subcategorySlug/cidade/:citySlug" element={<SubcategoryCityPage />} />
                    <Route path="/categoria/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
                    <Route path="/negocio/:slug" element={<BusinessPage />} />
                    <Route path="/pagina/:slug" element={<InstitutionalPage />} />
                    <Route path="/pesquisa" element={<SearchPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/top/:subcategorySlug/:citySlug" element={<TopRankingPage />} />
                    <Route path="/top/:subcategorySlug" element={<TopRankingPage />} />
                    <Route path="/p/:slug" element={<BusinessShortUrl />} />

                    {/* AUTH */}
                    <Route path="/login" element={<UserLogin />} />

                    {/* REGISTER STRUCTURE */}
                    <Route path="/register" element={<RegisterChoice />} />
                    <Route path="/registar/consumidor" element={<UserRegister />} />
                    <Route path="/register/business" element={<RegisterBusiness />} />

                    {/* PASSWORD RECOVERY */}
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* CLAIM FLOW */}
                    <Route path="/claim-business" element={<ClaimBusiness />} />

                    {/* DASHBOARDS */}
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/business-dashboard" element={<BusinessDashboard />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route path="/profile" element={<UserProfile />} />

                    {/* PEDIDOS */}
                    <Route path="/pedido/:id" element={<RequestDetailPage />} />

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

                    <Route path="/admin/stripe-setup" element={
                      <ProtectedRoute requireAdmin><StripeSetup /></ProtectedRoute>
                    } />
                    <Route path="/admin/stripe-cleanup" element={
                      <ProtectedRoute requireAdmin><StripeCleanup /></ProtectedRoute>
                    } />

                    <Route
                      path="/comercial"
                      element={
                        <ProtectedRoute requireCommercial>
                          <CommercialPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute requireOnboarding>
                          <OnboardingPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/cs"
                      element={
                        <ProtectedRoute requireCs>
                          <CustomerSuccessPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* SERVICES */}
                    <Route path="/pedir-servico" element={<RequestServicePage />} />
                    <Route path="/upgrade" element={<UpgradePage />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

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
