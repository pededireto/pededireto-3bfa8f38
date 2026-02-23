import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { useUserFavorites, useToggleFavorite } from "@/hooks/useUserFavorites";
import { useConsumerRequests } from "@/hooks/useServiceRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Heart, Trash2, ExternalLink, ClipboardList, User, AlertTriangle, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  novo: { label: "Novo", variant: "secondary" },
  em_contacto: { label: "Em Contacto", variant: "outline" },
  encaminhado: { label: "Encaminhado", variant: "default" },
  concluido: { label: "Concluído", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

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

  const { data: profile } = useQuery({
    queryKey: ["my-profile-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, city")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const profileIncomplete = profile && (!profile.full_name?.trim() || !profile.phone?.trim());

  useEffect(() => {
    if (authLoading || membershipLoading) return;
    if (!user) {
      navigate("/login");
    } else if (isAdmin) {
      navigate("/admin");
    } else if (membership?.business_id) {
      navigate("/business-dashboard");
    }
  }, [user, isAdmin, authLoading, membershipLoading, membership, navigate]);

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
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">A Minha Conta</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>

        {/* Profile Card */}
        {profile && (
          <Card className={`mb-6 ${profileIncomplete ? 'border-amber-400 dark:border-amber-500' : ''}`}>
            <CardContent className="py-5 px-6">
              {profileIncomplete && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">Complete o seu perfil para poder criar pedidos de serviço.</p>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="bg-primary/10 rounded-full p-3">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-foreground">{profile.full_name?.trim() || "Nome não preenchido"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {profile.email && (
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                      )}
                      {profile.phone?.trim() ? (
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Phone className="h-3.5 w-3.5" />Telefone em falta</span>
                      )}
                      {profile.city?.trim() && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.city}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/perfil">Editar Perfil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Card */}
        <Link to="/pedir-servico" className="block mb-8">
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

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Os Meus Pedidos
            </TabsTrigger>
            <TabsTrigger value="searches" className="gap-2">
              <Search className="h-4 w-4" />
              Pesquisas Guardadas
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              Meus Favoritos
            </TabsTrigger>
          </TabsList>

          {/* My Requests Tab */}
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
                  const cfg = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
                  return (
                    <Card key={req.id}>
                      <CardContent className="py-4 px-6 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary uppercase tracking-wide">
                              {req.categories?.name || "Sem categoria"}
                              {req.subcategories?.name ? ` • ${req.subcategories.name}` : ""}
                            </p>
                            <p className="font-medium text-foreground mt-1 line-clamp-2">
                              {req.description
                                ? req.description.length > 120
                                  ? req.description.slice(0, 120) + "…"
                                  : req.description
                                : "Sem descrição"}
                            </p>
                          </div>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {req.location_city && <span>📍 {req.location_city}</span>}
                          {req.urgency === "urgent" && <span className="text-destructive font-semibold">⚠ Urgente</span>}
                          <span>{new Date(req.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

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
                    Usa o botão "Guardar Pesquisa" na barra de pesquisa para guardares as tuas buscas.
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
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
