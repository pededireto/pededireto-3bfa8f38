import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerBlockProps {
  config: Record<string, any> | null;
}

const BannerBlock = ({ config }: BannerBlockProps) => {
  if (!config) return null;

  const { titulo, descricao, link, imagem_url } = config;

  return (
    <section className="py-8">
      <div className="container">
        <div
          className="relative rounded-2xl overflow-hidden bg-primary/10 p-8 md:p-12"
          style={imagem_url ? { backgroundImage: `url(${imagem_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          {imagem_url && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative z-10 max-w-2xl">
            {titulo && (
              <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${imagem_url ? "text-white" : "text-foreground"}`}>
                {titulo}
              </h2>
            )}
            {descricao && (
              <p className={`text-lg mb-4 ${imagem_url ? "text-white/90" : "text-muted-foreground"}`}>
                {descricao}
              </p>
            )}
            {link && (
              <Button asChild variant={imagem_url ? "secondary" : "default"}>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Saber mais
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerBlock;
