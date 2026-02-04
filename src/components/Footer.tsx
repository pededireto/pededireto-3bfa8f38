import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block">
              <h3 className="text-xl font-bold text-primary">Pede Direto</h3>
              <p className="text-sm text-muted-foreground">Do restaurante para ti.</p>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              Descobre restaurantes locais com canais próprios de entrega. 
              Normalmente mais barato do que apps de delivery.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Explorar</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Como Funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Parceiros */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Parceiros</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Área Parceiros
                </Link>
              </li>
              <li>
                <a href="mailto:parceiros@pededireto.pt" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pede Direto. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Feito com <Heart className="h-4 w-4 text-primary fill-primary" /> em Portugal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
