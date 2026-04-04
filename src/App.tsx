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
import StickySearch from "@/components/StickySearch";

import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import SubcategoryCityPage from "./pages/SubcategoryCityPage";
import SeoSubcategoryCityPage from "./pages/SeoSubcategoryCityPage";
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
import TopIndexPage from "./pages/TopIndexPage";
import PricingPage from "./pages/PricingPage";
import BusinessShortUrl from "./pages/BusinessShortUrl";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AffiliateLandingPage from "./pages/AffiliateLandingPage";
import UnsubscribePage from "./pages/UnsubscribePage";
import JobOffers from "./pages/JobOffers";
import JobOfferDetail from "./pages/JobOfferDetail";
import MyJobOffers from "./pages/MyJobOffers";
import StripeSetup from "./pages/admin/StripeSetup";
import StripeCleanup from "./pages/admin/StripeCleanup";

import StudioLayout from "./pages/studio/StudioLayout";
import StudioReelPage from "./pages/studio/StudioReelPage";
import StudioImagePage from "./pages/studio/StudioImagePage";
import StudioHistoryPage from "./pages/studio/StudioHistoryPage";
import StudioSettingsPage from "./pages/studio/StudioSettingsPage";

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
   REFERRAL TRACKING
   Guarda ?ref=CODIGO em sessionStorage
========================= */
const ReferralTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (refCode && /^PD-[A-Z0-9]{4}$/.test(refCode)) {
      localStorage.setItem("affiliate_ref", refCode);
    }
  }, [location.search]);

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
                <ReferralTracker />
                <RouteFocusHandler />
                <ScrollToTop />
                <SessionExpiredModal />
                <StickySearch />
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
                    <Route path="/top" element={<TopIndexPage />} />
                    <Route path="/top/:subcategorySlug/:citySlug" element={<TopRankingPage />} />
                    <Route path="/top/:subcategorySlug" element={<TopRankingPage />} />
                    <Route path="/s/:subSlug/:citySlug" element={<SeoSubcategoryCityPage />} />
                    <Route path="/p/:slug" element={<BusinessShortUrl />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/afiliados" element={<AffiliateLandingPage />} />
                    <Route path="/ofertas-emprego" element={<JobOffers />} />
                    <Route path="/ofertas-emprego/:slug" element={<JobOfferDetail />} />
                    <Route path="/minhas-ofertas" element={<MyJobOffers />} />

                    {/* AUTH */}
                    <Route path="/login" element={<UserLogin />} />

                    {/* REGISTER STRUCTURE */}
                    <Route path="/register" element={<RegisterChoice />} />
                    <Route path="/registar/consumidor" element={<UserRegister />} />
                    <Route path="/register/business" element={<RegisterBusiness />} />

                    <Route path="/auth/callback" element={<AuthCallback />} />

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

                    <Route path="/unsubscribe" element={<UnsubscribePage />} />

                    {/* MARKETING AI STUDIO */}
                    <Route path="/app" element={<StudioLayout />}>
                      <Route index element={<StudioReelPage />} />
                      <Route path="reel" element={<StudioReelPage />} />
                      <Route path="image" element={<StudioImagePage />} />
                      <Route path="history" element={<StudioHistoryPage />} />
                      <Route path="settings" element={<StudioSettingsPage />} />
                    </Route>

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
