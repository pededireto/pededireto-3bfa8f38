import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface QuickServicesSectionProps {
  config?: Record<string, any> | null;
}

const DEFAULT_ITEMS = [
  { icon: "💧", label: "Tenho uma fuga de água", link: "/pesquisa?q=canalizador" },
  { icon: "⚡", label: "Preciso de eletricista urgente", link: "/pesquisa?q=eletricista" },
  { icon: "🏠", label: "Preciso de obras em casa", link: "/pesquisa?q=obras" },
  { icon: "🔒", label: "Tranquei-me fora de casa", link: "/pesquisa?q=serralheiro" },
  { icon: "🍽️", label: "Quero encomendar comida", link: "/pesquisa?q=restaurante" },
  { icon: "💇", label: "Preciso de cabeleireiro", link: "/pesquisa?q=cabeleireiro" },
];

const QuickServicesSection = ({ config }: QuickServicesSectionProps) => {
  const title = config?.title || "O que precisas resolver hoje?";
  const items = config?.items?.length ? config.items : DEFAULT_ITEMS;

  return (
    <section className="py-14 md:py-20" style={{ background: "var(--gradient-hero)" }}>
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">{title}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {items.map((item: any, i: number) => (
            <Link
              key={i}
              to={item.link || "/pesquisa"}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <span className="text-3xl shrink-0">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickServicesSection;
