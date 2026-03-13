import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Trophy, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useCategories";
import { useAllSubcategories, type SubcategoryWithCategory } from "@/hooks/useSubcategories";

const TopIndexPage = () => {
  const [search, setSearch] = useState("");
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useAllSubcategories();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories
      .map((cat) => {
        const subs = subcategories.filter(
          (s) => s.category_id === cat.id && s.is_active
        );

        if (!term) return { category: cat, subcategories: subs };

        const catMatch = cat.name.toLowerCase().includes(term);
        const matchedSubs = subs.filter((s) =>
          s.name.toLowerCase().includes(term)
        );

        if (catMatch) return { category: cat, subcategories: subs };
        if (matchedSubs.length > 0)
          return { category: cat, subcategories: matchedSubs };
        return null;
      })
      .filter(Boolean) as {
      category: (typeof categories)[0];
      subcategories: SubcategoryWithCategory[];
    }[];
  }, [categories, subcategories, search]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://pededireto.pt/" },
      { "@type": "ListItem", position: 2, name: "Top Negócios", item: "https://pededireto.pt/top" },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Top Negócios em Portugal | Pede Direto</title>
        <meta
          name="description"
          content="Descubra os melhores profissionais e negócios por categoria em Portugal. Rankings atualizados de todas as subcategorias."
        />
        <link rel="canonical" href="https://pededireto.pt/top" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />

      <div className="container py-8 md:py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Trophy className="h-4 w-4" />
            Rankings atualizados
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Top Negócios em Portugal
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Descubra os melhores profissionais e negócios por categoria.
            Consulte os rankings e encontre quem precisa.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar categoria ou subcategoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma categoria encontrada para "{search}".
          </p>
        )}

        <div className="space-y-6">
          {filtered.map(({ category, subcategories: subs }) => (
            <section key={category.id} className="space-y-3">
              <div className="flex items-center gap-2">
                {category.icon && (
                  <span className="text-xl" aria-hidden="true">
                    {category.icon}
                  </span>
                )}
                <h2 className="text-xl font-semibold text-foreground">
                  {category.name}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {subs.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {subs.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/top/${sub.slug}`}
                    className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors group"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {sub.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default TopIndexPage;
