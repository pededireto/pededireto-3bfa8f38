import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, Briefcase, ArrowLeft, Loader2, MapPin, Eye, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserJobData, useFavoriteJob } from "@/hooks/useJobOffers";
import { useAuth } from "@/hooks/useAuth";

const JOB_TYPES: Record<string, string> = {
  full_time: "Tempo Inteiro",
  part_time: "Part-time",
  temporary: "Temporário",
  freelance: "Freelance",
  internship: "Estágio",
};

const MyJobOffers = () => {
  const { user } = useAuth();
  const { data, isLoading } = useUserJobData();
  const favMutation = useFavoriteJob();

  if (!user) {
    return (
      <>
        <Header />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Precisas de estar autenticado para ver as tuas ofertas.</p>
          <Link to="/login"><Button className="mt-4">Iniciar sessão</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>As Minhas Ofertas — PedeDireto</title>
      </Helmet>
      <Header />
      <div className="container py-8 space-y-6">
        <Link to="/ofertas-emprego" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar às ofertas
        </Link>
        <h1 className="text-2xl font-bold">As Minhas Ofertas</h1>

        <Tabs defaultValue="saved">
          <TabsList>
            <TabsTrigger value="saved"><Heart className="h-4 w-4 mr-1" /> Guardadas ({data?.favorites.length || 0})</TabsTrigger>
            <TabsTrigger value="applied"><Briefcase className="h-4 w-4 mr-1" /> Candidaturas ({data?.applications.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !data?.favorites.length ? (
              <p className="text-center text-muted-foreground py-12">Ainda não guardaste nenhuma oferta.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.favorites.map((fav: any) => {
                  const offer = fav.job_offers;
                  if (!offer) return null;
                  return (
                    <Card key={fav.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <Link to={`/ofertas-emprego/${offer.slug}`} className="font-medium hover:text-primary">{offer.title}</Link>
                          <button onClick={() => favMutation.mutate({ jobOfferId: offer.id, isFavorited: true })} className="p-1">
                            <Heart className="h-4 w-4 fill-destructive text-destructive" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">{offer.businesses?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />{offer.city}
                          <Badge variant="secondary" className="text-xs">{JOB_TYPES[offer.type] || offer.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !data?.applications.length ? (
              <p className="text-center text-muted-foreground py-12">Ainda não te candidataste a nenhuma oferta.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.applications.map((app: any) => {
                  const offer = app.job_offers;
                  if (!offer) return null;
                  return (
                    <Card key={app.id}>
                      <CardContent className="p-4 space-y-2">
                        <Link to={`/ofertas-emprego/${offer.slug}`} className="font-medium hover:text-primary">{offer.title}</Link>
                        <p className="text-sm text-muted-foreground">{offer.businesses?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />{offer.city}
                          <span>Candidatura a {new Date(app.created_at).toLocaleDateString("pt-PT")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  );
};

export default MyJobOffers;
