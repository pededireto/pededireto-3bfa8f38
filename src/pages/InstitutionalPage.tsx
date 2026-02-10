import { useParams } from "react-router-dom";
import { useInstitutionalPage } from "@/hooks/useInstitutionalPages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlockRenderer from "@/components/BlockRenderer";
import { Loader2 } from "lucide-react";
import DOMPurify from "dompurify";

const InstitutionalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = useInstitutionalPage(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
            <p className="text-muted-foreground">Esta página não está disponível.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {page.meta_title && <title>{page.meta_title}</title>}
      <Header />
      <main className="flex-1">
        <section className="section-hero py-12">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold">{page.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="container max-w-3xl">
            {page.page_type === "advanced" && page.blocks.length > 0 ? (
              <BlockRenderer blocks={page.blocks} />
            ) : page.content ? (
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
              />
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default InstitutionalPage;
