import { useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearch } from "@/hooks/useSearch";
import { useSmartSearch } from "@/hooks/useSmartSearch";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartSearchBanner from "@/components/SmartSearchBanner";
import BusinessCard from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
  MapPin,
  Building2,
  FolderOpen,
} from "lucide-react";

const BASE_URL = "https://pededireto.pt";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(q);
  const [cityFilter, setCityFilter] = useState(searchParams.get("cidade") || "");
  const { user } = useAuth();

  // Sincronizar input com URL
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  // Buscar cidade do perfil do utilizador para personalizar resultados
  const { data: userProfile } = useQuery({
    queryKey: ["profile-city", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("city")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const effectiveCity = cityFilter || userProfile?.city || null;

  // Pesquisa normal (RPC)
  const { data: searchResults = [], isLoading: searchLoading } = useSearch(q);

  // Pesquisa inteligente (sinónimos + complementares)
  const { data: smartResult, isLoading: smartLoading } = useSmartSearch(q, effectiveCity);

  // Negócios dos resultados normais para mostrar em cards
  const businessResults = searchResults.filter((r) => r.result_type === "business");
  const subcategoryResults = searchResults.filter((r) => r.result_type === "subcategory");

  const isLoading = searchLoading || smartLoading;
  const hasNormalResults = searchResults.length > 0;
  const hasSmartResults = smartResult?.isSmartMatch && smartResult.businesses.length > 0;
  const hasAnyResults = hasNormalResults || hasSmartResults;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().length >= 2) {
      const params: Record<string, string> = { q: inputValue.trim() };
      if (cityFilter) params.cidade = cityFilter;
      setSearchParams(params);
    }
  };

  const pageTitle = q
    ? `Resultados para "${q}" | Pede Direto`
    : "Pesquisa | Pede Direto";

  const pageDescription = q
    ? `Encontre ${q} perto de si. Contacte diretamente, sem intermediários.`
    : "Pesquise serviços e profissionais no Pede Direto.";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* ── Search Header ─────────────────────────────────────────────── */}
        <section className="section-hero py-6 border-b border-border">
          <div className="container">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-3xl">
              {/* Campo de pesquisa */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="O que procura? (ex: canalizador, pizza...)"
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
              </div>

              {/* Filtro de cidade */}
              <div className="relative w-full sm:w-48">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Cidade..."
                  className="pl-9 h-12"
                />
              </div>

              <Button type="submit" size="lg" className="h-12 px-6 flex-shrink-0">
                Pesquisar
              </Button>
            </form>

            {/* Info contextual */}
            {q && !isLoading && (
              <p className="mt-3 text-sm text-muted-foreground">
                {hasAnyResults ? (
                  <>
                    Resultados para{" "}
                    <span className="font-semibold text-foreground">"{q}"</span>
                    {effectiveCity && (
                      <>
                        {" "}em{" "}
                        <span className="font-semibold text-foreground">{effectiveCity}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Sem resultados diretos para{" "}
                    <span className="font-semibold text-foreground">"{q}"</span>
                  </>
                )}
              </p>
            )}
          </div>
        </section>

        {/* ── Resultados ────────────────────────────────────────────────── */}
        <section className="py-8">
          <div className="container max-w-5xl">

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && q.length >= 2 && (
              <div className="space-y-8">

                {/* ── Smart Search Banner (problema → solução) ─────────── */}
                {smartResult?.isSmartMatch && (
                  <SmartSearchBanner result={smartResult} userCity={effectiveCity} />
                )}

                {/* ── Subcategorias encontradas ─────────────────────────── */}
                {subcategoryResults.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Categorias relacionadas
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subcategoryResults.map((result) => (
                        <Link
                          key={result.result_id}
                          to={`/categoria/${result.category_slug}/${result.result_slug}`}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">
                              {result.result_name}
                            </p>
                            {result.category_name && (
                              <p className="text-xs text-muted-foreground">{result.category_name}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Negócios encontrados pela RPC ─────────────────────── */}
                {businessResults.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Negócios encontrados
                      <span className="text-sm font-normal text-muted-foreground">
                        ({businessResults.length})
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {businessResults.map((result) => (
                        <Link
                          key={result.result_id}
                          to={`/negocio/${result.result_slug}`}
                          className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {result.result_name}
                            </p>
                            {result.category_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.category_name}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Zero resultados em tudo ────────────────────────────── */}
                {!hasAnyResults && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                      Não encontrámos resultados para "{q}"
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Tente pesquisar por outras palavras, ou descreva o seu problema
                      e nós encontramos quem resolve.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild>
                        <Link to="/pedir-servico">
                          Pedir orçamento gratuito
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/">
                          Ver todas as categorias
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estado inicial — sem pesquisa */}
            {!isLoading && q.length < 2 && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Escreva pelo menos 2 caracteres para pesquisar
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
