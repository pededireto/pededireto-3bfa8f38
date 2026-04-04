import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, Briefcase, Heart, Eye, Users, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicJobOffers, useFavoriteJob, useUserJobData, type JobFilters, type JobOffer } from "@/hooks/useJobOffers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { differenceInDays, differenceInHours } from "date-fns";

const JOB_TYPES: Record<string, string> = {
  full_time: "Tempo Inteiro",
  part_time: "Part-time",
  temporary: "Temporário",
  freelance: "Freelance",
  internship: "Estágio",
};

const JobOffers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<JobFilters>({ sort: "recent", page: 0 });
  const { data, isLoading } = usePublicJobOffers(filters);
  const { data: userData } = useUserJobData();
  const favMutation = useFavoriteJob();

  const favIds = useMemo(() => new Set((userData?.favorites || []).map((f: any) => f.job_offer_id)), [userData]);
  const appliedIds = useMemo(() => new Set((userData?.applications || []).map((a: any) => a.job_offer_id)), [userData]);

  const handleSearch = () => {
    // Parse "cozinheiro lisboa" → search + city
    const parts = searchInput.trim().split(/\s+/);
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 0 }));
  };

  const handleFav = (id: string) => {
    if (!user) { toast.info("Cria conta gratuita para guardar ofertas."); navigate("/login"); return; }
    favMutation.mutate({ jobOfferId: id, isFavorited: favIds.has(id) });
  };

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <>
      <Helmet>
        <title>Ofertas de Emprego — PedeDireto</title>
        <meta name="description" content="Encontra as melhores ofertas de emprego locais. Candidata-te directamente a oportunidades perto de ti." />
        <link rel="canonical" href="https://pededireto.lovable.app/ofertas-emprego" />
      </Helmet>
      <Header />
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Ofertas de Emprego</h1>
          <p className="text-muted-foreground">Encontra oportunidades perto de ti e candidata-te directamente.</p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: cozinheiro, motorista, designer..."
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={filters.type || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "all" ? undefined : v, page: 0 }))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(JOB_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sort || "recent"} onValueChange={(v: any) => setFilters((f) => ({ ...f, sort: v, page: 0 }))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>Pesquisar</Button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !data?.offers.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Sem ofertas disponíveis</p>
            <p className="text-sm">Tenta outros filtros ou volta mais tarde.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{data.total} oferta{data.total !== 1 ? "s" : ""} encontrada{data.total !== 1 ? "s" : ""}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {data.offers.map((offer) => (
                <JobCard
                  key={offer.id}
                  offer={offer}
                  isFav={favIds.has(offer.id)}
                  isApplied={appliedIds.has(offer.id)}
                  onFav={() => handleFav(offer.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={!filters.page} onClick={() => setFilters((f) => ({ ...f, page: (f.page || 0) - 1 }))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Página {(filters.page || 0) + 1} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={(filters.page || 0) >= totalPages - 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page || 0) + 1 }))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

// ── Card component ──
const JobCard = ({ offer, isFav, isApplied, onFav }: { offer: JobOffer; isFav: boolean; isApplied: boolean; onFav: () => void }) => {
  const hoursAgo = differenceInHours(new Date(), new Date(offer.created_at));
  const daysLeft = differenceInDays(new Date(offer.expires_at), new Date());
  const isNew = hoursAgo < 24;
  const isPopular = (offer.views_count || 0) > 50;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          {offer.businesses?.logo_url ? (
            <img src={offer.businesses.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-muted flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/ofertas-emprego/${offer.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
              {offer.title}
            </Link>
            <p className="text-sm text-muted-foreground">{offer.businesses?.name}</p>
          </div>
          <button onClick={onFav} className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors">
            <Heart className={`h-5 w-5 ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{offer.city}</span>
          <Badge variant="secondary" className="text-xs">{JOB_TYPES[offer.type] || offer.type}</Badge>
          {offer.salary_range && <Badge variant="outline" className="text-xs">{offer.salary_range}</Badge>}
          {isNew && <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30 text-xs">Novo</Badge>}
          {isPopular && <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30 text-xs">Popular</Badge>}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{offer.views_count}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{offer.applications_count} candidato{offer.applications_count !== 1 ? "s" : ""}</span>
          </div>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Expira em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}</span>
        </div>

        {isApplied && (
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">✓ Candidatura enviada</Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default JobOffers;
