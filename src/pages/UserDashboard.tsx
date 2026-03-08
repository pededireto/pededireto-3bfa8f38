import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { useUserFavorites, useToggleFavorite } from "@/hooks/useUserFavorites";
import { useConsumerRequests, useConsumerRequestsMeta, useConsumerRequestReviews, type RequestReviewInfo } from "@/hooks/useServiceRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Search,
  Heart,
  Trash2,
  ExternalLink,
  ClipboardList,
  User,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Store,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConsumerMetricsBar from "@/components/consumer/ConsumerMetricsBar";
import ConsumerBadgesSection from "@/components/consumer/ConsumerBadgesSection";
import ConsumerRequestCard from "@/components/consumer/ConsumerRequestCard";
import ConsumerActivityTimeline from "@/components/consumer/ConsumerActivityTimeline";

const UserDashboard = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: savedSearches = [], isLoading: searchesLoading } = useSavedSearches();
  const { data: favorites = [], isLoading: favoritesLoading } = useUserFavorites();
  const { data: myRequests = [], isLoading: requestsLoading } = useConsumerRequests();
  const deleteSearch = useDeleteSavedSearch();
  const toggleFavorite = useToggleFavorite();

  const requestIds = myRequests.map((r: any) => r.id);
  const { data: requestMeta = {} } = useConsumerRequestsMeta(requestIds);
  const { data: requestReviews = {} } = useConsumerRequestReviews(requestIds);

  const totalUnread = Object.values(requestMeta).filter((m: any) => m.hasUnread).length;

  const { data: profile } = useQuery({
    queryKey: ["my-profile-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, city")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Count user reviews
  const { data: reviewsCount = 0 } = useQuery({
    queryKey: ["my-reviews-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("business_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: businessInfo } = useQuery({
    queryKey: ["business-name", membership?.business_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", membership!.business_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!membership?.business_id,
  });

  const profileIncomplete = profile && (!profile.full_name?.trim() || !profile.phone?.trim());
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "utilizador";

  useEffect(() => {
    if (authLoading || membershipLoading) return;
    if (!user) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, membershipLoading, navigate]);

  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isAdmin) return null;

  const handleDeleteSearch = (id: string) => {
    deleteSearch.mutate(id, {
      onSuccess: () => toast({ title: "Pesquisa removida" }),
      onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
    });
  };

  const handleRemoveFavorite = (businessId: string) => {
    toggleFavorite.mutate(
      { businessId, isFavorited: true },
      {
        onSuccess: () => toast({ title: "Favorito removido" }),
        onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8 space-y-6">
        {/* ── A — Header personalizado ─────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {new Date().toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* ── Banner: Negócio registado ─────────────────────────────────── */}
        {membership?.business_id && (
          <Card className="border-primary/40 bg-primary/5 dark:bg-primary/10">
            <CardContent className="py-4 px-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/15 rounded-full p-2.5">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Tens um negócio registado</p>
                    {businessInfo?.name && <p className="text-xs text-muted-foreground mt-0.5">{businessInfo.name}</p>}
                  </div>
                </div>
                <Button asChild size="sm" className="gap-2 flex-shrink-0">
                  <Link to="/business-dashboard">
                    <Store className="h-4 w-4" />
                    Painel do Negócio
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Profile warning ───────────────────────────────────────────── */}
        {profileIncomplete && (
          <Card className="border-amber-400 dark:border-amber-500">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Complete o seu perfil para criar pedidos</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {profile?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {profile.email}
                      </span>
                    )}
                    {!profile?.phone?.trim() && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Phone className="h-3 w-3" /> Telefone em falta
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/perfil">Completar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── B — Métricas ───────────────────────────────────────────── */}
        <ConsumerMetricsBar
          requestsCount={myRequests.length}
          unreadCount={totalUnread}
          favoritesCount={favorites.length}
          reviewsCount={reviewsCount}
        />

        {/* ── C — CTA Pedir Serviço ──────────────────────────────────── */}
        <Link to="/pedir-servico" className="block">
          <Card className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
            <CardContent className="flex items-center gap-4 py-5 px-6">
              <div className="bg-primary-foreground/20 rounded-full p-3">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Pedir Serviço</h3>
                <p className="text-sm opacity-90">Descreva o que precisa e receba respostas de profissionais.</p>
              </div>
              <ExternalLink className="h-5 w-5 opacity-70" />
            </CardContent>
          </Card>
        </Link>

        {/* ── D — Badges (Conquistas) ────────────────────────────────── */}
        <ConsumerBadgesSection profileId={profile?.id} />

        {/* ── E — Activity Timeline ───────────────────────────────── */}
        <ConsumerActivityTimeline userId={user?.id} />

        {/* ── F — Tabs ───────────────────────────────────────────────── */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Pedidos
              {totalUnread > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5">
                  {totalUnread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="searches" className="gap-2">
              <Search className="h-4 w-4" />
              Pesquisas
            </TabsTrigger>
          </TabsList>

          {/* ── Pedidos ─────────────────────────────────────────────────── */}
          <TabsContent value="requests">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Ainda não fizeste nenhum pedido de serviço.</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/pedir-servico">Fazer o primeiro pedido</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req: any) => {
                  const meta = (requestMeta as any)[req.id];
                  const reviews: RequestReviewInfo[] =
                    (requestReviews as Record<string, RequestReviewInfo[]>)[req.id] || [];
                  return (
                    <ConsumerRequestCard
                      key={req.id}
                      req={req}
                      meta={meta}
                      reviews={reviews}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Favoritos ───────────────────────────────────────────────── */}
          <TabsContent value="favorites">
            {favoritesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : favorites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Ainda não adicionaste nenhum favorito.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clica no ❤️ nos negócios para os adicionares aos teus favoritos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav: any) => {
                  const biz = fav.businesses;
                  if (!biz) return null;
                  return (
                    <Card key={fav.id} className="overflow-hidden">
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="max-w-full max-h-full object-contain p-2" />
                        ) : (
                          <span className="text-4xl font-bold text-primary/40">{biz.name?.charAt(0)}</span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        {biz.categories && (
                          <span className="text-xs font-medium text-primary uppercase tracking-wide">
                            {biz.categories.name}
                          </span>
                        )}
                        <h3 className="font-bold text-lg mt-1">{biz.name}</h3>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <Link to={`/negocio/${biz.slug}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Ver
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemoveFavorite(fav.business_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Pesquisas Guardadas ──────────────────────────────────────── */}
          <TabsContent value="searches">
            {searchesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedSearches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Ainda não guardaste nenhuma pesquisa.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usa o botão "Guardar Pesquisa" na barra de pesquisa.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedSearches.map((search) => (
                  <Card key={search.id}>
                    <CardContent className="flex items-center justify-between py-4 px-6">
                      <div className="flex items-center gap-3 min-w-0">
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{search.search_query}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(search.created_at!).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSearch(search.id)}
                        className="text-destructive hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
