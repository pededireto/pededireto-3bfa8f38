import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, Eye, ArrowLeft, ArrowRight, Share2, Facebook, Copy, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

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

/** Simple markdown-to-HTML renderer (no dependencies) */
const renderMarkdown = (content: string): string => {
  return content
    // headings
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-foreground">$1</h2>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    // paragraphs (lines that aren't already HTML)
    .replace(/^(?!<[hla-z])([\S].+)$/gm, '<p class="text-muted-foreground leading-relaxed mb-3">$1</p>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-1 mb-4">$&</ul>');
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isPending } = useBlogPost(slug);
  const { data: allPosts = [] } = useBlogPosts();

  // Increment views
  useEffect(() => {
    if (slug) {
      supabase.rpc("increment_blog_views", { post_slug: slug });
    }
  }, [slug]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  };

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const relatedPosts = post ? allPosts.filter((p) => p.category === post.category && p.slug !== slug).slice(0, 3) : [];

  const shareUrl = `https://pededireto.pt/blog/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado!" });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-10 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Link to="/blog" className="text-primary hover:underline">← Voltar ao blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{post.meta_title || post.title} | PedeDireto</title>
        <meta name="description" content={post.meta_description || post.excerpt || ""} />
        <link rel="canonical" href={shareUrl} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || ""} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={shareUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.cover_image_url,
            author: { "@type": "Organization", name: post.author_name },
            publisher: { "@type": "Organization", name: "PedeDireto", url: "https://pededireto.pt" },
            datePublished: post.published_at,
            url: shareUrl,
          })}
        </script>
      </Helmet>

      <Header />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {/* Breadcrumb */}
        <div className="container pt-6">
          <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Início</Link>
            <span className="mx-2">›</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span className="mx-2">›</span>
            <span className="text-foreground">{post.title}</span>
          </nav>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
            {/* Main content */}
            <article>
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full max-h-[400px] object-cover rounded-xl mb-8"
                />
              )}

              <Badge className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS.outros} variant="secondary">
                {CATEGORY_LABELS[post.category] || post.category}
              </Badge>

              <h1 className="text-2xl md:text-4xl font-bold text-foreground mt-4 mb-4">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
                <span>{post.author_name}</span>
                <span>{formatDate(post.published_at)}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.read_time_minutes} min de leitura</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.views_count} visualizações</span>
              </div>

              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
              />

              {/* Share */}
              <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5"><Share2 className="h-4 w-4" /> Partilhar:</span>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 mr-1" /> Facebook
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar link
                </Button>
              </div>

              {/* Prev/Next */}
              <div className="flex justify-between gap-4 mt-10 pt-6 border-t border-border">
                {prevPost ? (
                  <Link to={`/blog/${prevPost.slug}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> {prevPost.title}
                  </Link>
                ) : <div />}
                {nextPost ? (
                  <Link to={`/blog/${nextPost.slug}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-right">
                    {nextPost.title} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : <div />}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block space-y-6">
              {relatedPosts.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4">Artigos relacionados</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((rp) => (
                      <Link key={rp.id} to={`/blog/${rp.slug}`} className="block group">
                        {rp.cover_image_url && (
                          <img src={rp.cover_image_url} alt={rp.title} className="w-full h-24 object-cover rounded-lg mb-2" loading="lazy" />
                        )}
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{rp.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rp.read_time_minutes} min · {formatDate(rp.published_at)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
                <p className="font-semibold text-foreground mb-2">Precisa de um profissional?</p>
                <p className="text-sm text-muted-foreground mb-4">Encontre os melhores profissionais na sua zona.</p>
                <Button asChild size="sm">
                  <Link to="/">Pesquisar agora</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
