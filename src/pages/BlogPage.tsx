import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  servicos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  obras: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  negocios: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dicas: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  servicos: "Serviços",
  obras: "Obras",
  negocios: "Negócios",
  dicas: "Dicas",
  outros: "Outros",
};

const CATEGORIES = [
  { value: "todos", label: "Todos" },
  { value: "servicos", label: "Serviços" },
  { value: "obras", label: "Obras" },
  { value: "negocios", label: "Negócios" },
  { value: "dicas", label: "Dicas" },
];

const BlogPage = () => {
  const [category, setCategory] = useState("todos");
  const { data: posts = [], isPending } = useBlogPosts(category);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Guias & Dicas | PedeDireto</title>
        <meta
          name="description"
          content="Dicas, guias e artigos sobre serviços, obras e negócios locais. Aprende a contratar com confiança."
        />
        <link rel="canonical" href="https://pededireto.pt/blog" />
      </Helmet>

      <Header />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Hero */}
        <section className="bg-muted/50 border-b border-border py-10 md:py-14">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">Blog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Guias & Dicas
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Artigos práticos para contratar melhor, gerir o teu negócio e
              tirar o máximo da plataforma.
            </p>
          </div>
        </section>

        {/* Category filters */}
        <div className="container py-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts grid */}
        <div className="container pb-16">
          {isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  <Skeleton className="h-[200px] w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Ainda não há artigos nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-[200px] bg-muted flex items-center justify-center overflow-hidden">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <Badge
                      className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS.outros}
                      variant="secondary"
                    >
                      {CATEGORY_LABELS[post.category] || post.category}
                    </Badge>
                    <h2 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span>{formatDate(post.published_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.read_time_minutes} min
                      </span>
                    </div>
                  </div>
                </Link>
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
