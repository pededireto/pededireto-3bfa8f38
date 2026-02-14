import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessMembership } from "@/hooks/useBusinessMembership";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { useUserFavorites, useToggleFavorite } from "@/hooks/useUserFavorites";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Heart, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: savedSearches = [], isLoading: searchesLoading } = useSavedSearches();
  const { data: favorites = [], isLoading: favoritesLoading } = useUserFavorites();
  const deleteSearch = useDeleteSavedSearch();
  const toggleFavorite = useToggleFavorite();

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

        <Tabs defaultValue="searches" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="searches" className="gap-2">
              <Search className="h-4 w-4" />
              Pesquisas Guardadas
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              Meus Favoritos
            </TabsTrigger>
          </TabsList>

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
