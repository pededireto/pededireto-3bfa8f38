import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useFeaturedBlogPosts } from "@/hooks/useBlogPosts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  servicos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  obras: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  negocios: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dicas: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  outros: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  servicos: "Serviços", obras: "Obras", negocios: "Negócios", dicas: "Dicas", outros: "Outros",
};

const LatestBlogPosts = () => {
  const { data: posts = [] } = useFeaturedBlogPosts(3);

  if (posts.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Guias & Dicas</h2>
          <p className="text-muted-foreground">Aprende a contratar com confiança</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-[180px] bg-muted flex items-center justify-center overflow-hidden">
                {post.cover_image_url ? (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-muted-foreground/30 text-3xl">📄</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <Badge className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS.outros} variant="secondary">
                  {CATEGORY_LABELS[post.category] || post.category}
                </Badge>
                <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {post.read_time_minutes} min
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link to="/blog">Ver todos os artigos <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LatestBlogPosts;
