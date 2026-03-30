import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Trophy, ChevronRight, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/useCategories";
import { useAllSubcategories, type SubcategoryWithCategory } from "@/hooks/useSubcategories";

const TopIndexPage = () => {
  const [search, setSearch] = useState("");
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const { data: categories = [] } = useCategories();
  const { data: subcategories = [] } = useAllSubcategories();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories
      .map((cat) => {
        const subs = subcategories.filter((s) => s.category_id === cat.id && s.is_active);

        if (!term) return { category: cat, subcategories: subs };

        const catMatch = cat.name.toLowerCase().includes(term);
        const matchedSubs = subs.filter((s) => s.name.toLowerCase().includes(term));

        if (catMatch) return { category: cat, subcategories: subs };
        if (matchedSubs.length > 0) return { category: cat, subcategories: matchedSubs };
        return null;
      })
      .filter(Boolean) as {
      category: (typeof categories)[0];
      subcategories: SubcategoryWithCategory[];
    }[];
  }, [categories, subcategories, search]);

  // Auto-open accordion based on search results
  useEffect(() => {
    if (!search.trim()) {
      setOpenCategoryId(null);
      return;
    }
    const matches = filtered.filter((f) => f.subcategories.length > 0);
    if (matches.length === 1) {
      setOpenCategoryId(matches[0].category.id);
    } else if (matches.length > 1) {
      setOpenCategoryId("__all__");
    }
  }, [search, filtered]);

  const toggleCategory = (id: string) => {
    setOpenCategoryId((prev) => (prev === id ? null : id));
  };

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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Top Negócios em Portugal</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Descubra os melhores profissionais e negócios por categoria. Consulte os rankings e encontre quem precisa.
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma categoria encontrada para "{search}".</p>
        )}

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ category, subcategories: subs }) => {
            const isOpen = openCategoryId === "__all__" || openCategoryId === category.id;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card"
              >
                {/* Card header — clickable */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-expanded={isOpen}
                >
                  {/* Category image */}
                  <div className="relative w-full aspect-[16/7] overflow-hidden bg-muted">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/50 select-none">{category.name.charAt(0)}</span>
                      </div>
                    )}
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>

                  {/* Category name row */}
                  <div className="flex items-center justify-between px-4 py-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-sm font-semibold text-foreground truncate">{category.name.trim()}</h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        {subs.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Accordion — subcategories */}
                {isOpen && subs.length > 0 && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <div className="grid grid-cols-1 gap-0.5">
                      {subs.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/top/${sub.slug}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/60 transition-colors group"
                        >
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                            {sub.name}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty subcategories state */}
                {isOpen && subs.length === 0 && (
                  <div className="border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">Sem subcategorias disponíveis.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default TopIndexPage;
