import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "todos", label: "Todos" },
  { value: "servicos", label: "Serviços" },
  { value: "obras", label: "Obras" },
  { value: "negocios", label: "Negócios" },
  { value: "dicas", label: "Dicas" },
];

const CATEGORY_COLORS: Record<string, string> = {
  servicos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  obras: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  negocios: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dicas: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const ITEMS_PER_PAGE = 10;

const BlogPage = () => {
  const [category, setCategory] = useState("todos");
  const [page, setPage] = useState(1);
  const { data: posts = [], isPending } = useBlogPosts(category);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const paginatedPosts = posts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Guias & Dicas | PedeDireto</title>
        <meta
          name="description"
          content="Tudo o que precisas de saber para contratar profissionais com confiança. Guias práticos, dicas e preços de referência."
        />
        <link rel="canonical" href="https://pededireto.pt/blog" />
      </Helmet>

      <Header />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-20">
          <div className="container text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Guias & Dicas</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo o que precisas de saber para contratar com confiança
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="container py-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCategory(cat.value);
                  setPage(1);
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="container pb-16">
          {isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : paginatedPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum artigo encontrado nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.cover_image_url && (
                    <div className="w-full">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-auto object-contain group-hover:opacity-95 transition-opacity duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <Badge className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS.outros} variant="secondary">
                      {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                    </Badge>
                    <h2 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>{post.author_name}</span>
                      <span>{formatDate(post.published_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.read_time_minutes} min
                      </span>
                    </div>
                    <span className="text-sm font-medium text-primary inline-flex items-center gap-1 pt-1">
                      Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={page === p ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
