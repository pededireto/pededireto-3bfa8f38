import { useParams } from "react-router-dom";
import { useInstitutionalPage } from "@/hooks/useInstitutionalPages";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlockRenderer from "@/components/BlockRenderer";
import ConsumersLandingPage from "@/components/ConsumersLandingPage";
import BusinessLandingPage from "@/components/BusinessLandingPage";
import AboutLandingPage from "@/components/AboutLandingPage";
import EmergencyLandingPage from "@/components/EmergencyLandingPage";
import { Loader2 } from "lucide-react";
import DOMPurify from "dompurify";

const BASE_URL = "https://pededireto.pt";

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

  /* ===========================
     SEO DINÂMICO
  =========================== */

  const pageTitle = (page as any).meta_title || `${page.title} | Pede Direto`;

  const pageDescription = (page as any).meta_description
    ? (page as any).meta_description.slice(0, 155)
    : page.content
    ? DOMPurify.sanitize(page.content).replace(/<[^>]*>/g, "").slice(0, 155)
    : "Pede Direto — A plataforma onde encontra o que precisa, sem intermediários.";

  const pageUrl = `${BASE_URL}/p/${slug}`;

  const pageImage = (page as any).og_image || (page as any).image_url || `${BASE_URL}/og-default.jpg`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
  };

  /* =========================== */

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:url" content={pageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />

        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <Header />
      <main className="flex-1">
        {slug === "pedediretoconsumidores" ? (
          <ConsumersLandingPage />
        ) : slug === "pedebusinesspaginaprincipal" ? (
          <BusinessLandingPage />
        ) : slug === "quem-somos" ? (
          <AboutLandingPage />
        ) : slug === "gestao" ? (
          <EmergencyLandingPage />
        ) : (
          <>
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
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InstitutionalPage;
