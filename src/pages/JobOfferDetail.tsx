import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, Briefcase, Heart, Eye, Users, Clock, Mail, Phone, Copy, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useJobOfferDetail, useApplyToJob, useFavoriteJob, useUserJobData, usePublicJobOffers } from "@/hooks/useJobOffers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

const JOB_TYPES: Record<string, string> = {
  full_time: "Tempo Inteiro",
  part_time: "Part-time",
  temporary: "Temporário",
  freelance: "Freelance",
  internship: "Estágio",
};

const JobOfferDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: offer, isLoading } = useJobOfferDetail(slug);
  const applyMutation = useApplyToJob();
  const favMutation = useFavoriteJob();
  const { data: userData } = useUserJobData();
  const [showContacts, setShowContacts] = useState(false);

  // Similar offers
  const { data: similarData } = usePublicJobOffers({ city: offer?.city, sort: "recent" });
  const similar = (similarData?.offers || []).filter((o) => o.id !== offer?.id).slice(0, 4);

  const isFav = (userData?.favorites || []).some((f: any) => f.job_offer_id === offer?.id);
  const isApplied = (userData?.applications || []).some((a: any) => a.job_offer_id === offer?.id);
  const daysLeft = offer ? differenceInDays(new Date(offer.expires_at), new Date()) : 0;

  const handleApply = () => {
    if (!user) {
      toast.info("Cria conta gratuita para te candidatares.");
      navigate(`/login?redirect=/ofertas-emprego/${slug}`);
      return;
    }
    applyMutation.mutate(offer!.id, {
      onSuccess: () => setShowContacts(true),
    });
  };

  const handleFav = () => {
    if (!user) { toast.info("Cria conta para guardar ofertas."); navigate("/login"); return; }
    favMutation.mutate({ jobOfferId: offer!.id, isFavorited: isFav });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Oferta não encontrada</h1>
          <Link to="/ofertas-emprego"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Voltar às ofertas</Button></Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{offer.title} — {offer.city} | PedeDireto</title>
        <meta name="description" content={`${offer.title} em ${offer.city}. ${offer.description.slice(0, 150)}`} />
        <link rel="canonical" href={`https://pededireto.lovable.app/ofertas-emprego/${offer.slug}`} />
      </Helmet>
      <Header />
      <div className="container py-8">
        <Link to="/ofertas-emprego" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar às ofertas
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {offer.businesses?.logo_url ? (
                  <img src={offer.businesses.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover bg-muted" />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{offer.title}</h1>
                  <Link to={`/negocio/${offer.businesses?.slug}`} className="text-primary hover:underline font-medium">
                    {offer.businesses?.name}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary"><MapPin className="h-3.5 w-3.5 mr-1" />{offer.city}</Badge>
                <Badge variant="secondary"><Briefcase className="h-3.5 w-3.5 mr-1" />{JOB_TYPES[offer.type] || offer.type}</Badge>
                {offer.salary_range && <Badge variant="outline">{offer.salary_range}</Badge>}
                <Badge variant="outline"><Clock className="h-3.5 w-3.5 mr-1" />Expira em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}</Badge>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {offer.description}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                {isApplied ? (
                  <Button className="w-full" variant="outline" disabled>✓ Candidatura enviada</Button>
                ) : (
                  <Button className="w-full" onClick={handleApply} disabled={applyMutation.isPending}>
                    📩 Candidatar-me
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={handleFav}>
                  <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                  {isFav ? "Guardada" : "Guardar"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Eye className="h-4 w-4" />{offer.views_count} visualizações</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" />{offer.applications_count} candidato{offer.applications_count !== 1 ? "s" : ""}</div>
              </CardContent>
            </Card>

            {/* Similar offers */}
            {similar.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Ofertas semelhantes</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  {similar.map((s) => (
                    <Link key={s.id} to={`/ofertas-emprego/${s.slug}`} className="block text-sm hover:text-primary transition-colors">
                      <p className="font-medium line-clamp-1">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.businesses?.name} · {s.city}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Contacts modal */}
      <Dialog open={showContacts} onOpenChange={setShowContacts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactos da empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">A sua candidatura foi registada. Use os contactos abaixo para enviar a sua candidatura.</p>
            {offer.contact_email && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="text-sm">{offer.contact_email}</span></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(offer.contact_email!)}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" asChild><a href={`mailto:${offer.contact_email}`}><Mail className="h-4 w-4" /></a></Button>
                </div>
              </div>
            )}
            {offer.contact_phone && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span className="text-sm">{offer.contact_phone}</span></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(offer.contact_phone!)}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" asChild><a href={`tel:${offer.contact_phone}`}><Phone className="h-4 w-4" /></a></Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default JobOfferDetail;
