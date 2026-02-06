import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import verdinhoMascot from "@/assets/verdinho-mascot.png";

interface HeroSectionProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const HeroSection = ({ onSearch, searchTerm = "", onSearchChange }: HeroSectionProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  return (
    <section className="section-hero py-12 md:py-20">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Tem um problema?{" "}
              <span className="text-gradient-primary">Nós mostramos quem resolve.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Restaurantes, serviços, lojas e profissionais — tudo num só sítio.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSubmit} className="max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="O que procura? (ex: canalizador, pizza, barbearia...)"
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="search-input-hero pl-12 pr-4"
                />
              </div>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button 
                className="btn-cta-primary text-base"
                onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })}
              >
                Encontrar quem resolve
              </Button>
              <Button 
                variant="outline" 
                className="btn-cta-outline text-base"
                onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver categorias
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="trust-badge">
                ✓ Contactos diretos
              </span>
              <span className="trust-badge">
                ✓ Sem intermediários
              </span>
              <span className="trust-badge">
                ✓ Resposta rápida
              </span>
            </div>
          </div>

          {/* Right Content - Mascot */}
          <div className="hidden md:flex justify-center items-center relative">
            <div className="relative animate-float">
              <img 
                src={verdinhoMascot} 
                alt="Verdinho - Mascote do Pede Direto" 
                className="w-72 lg:w-96 drop-shadow-2xl"
              />
              {/* Speech Bubble */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border border-border max-w-[200px]">
                <p className="text-sm font-medium text-foreground">
                  Eu ajudo-te a encontrar quem resolve! 💚
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
