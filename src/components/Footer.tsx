import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-primary">Pede Direto</span>
            </Link>
            <p className="text-background/70 max-w-md">
              Encontre rapidamente o contacto que resolve o seu problema. 
              Restaurantes, serviços, lojas e profissionais — tudo num só sítio.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/#categorias" className="hover:text-primary transition-colors">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-primary transition-colors">
                  Área Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-background/70">
              <li>info@pededireto.pt</li>
              <li>Portugal</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} Pede Direto. Todos os direitos reservados.
          </p>
          <p className="text-background/50 text-sm flex items-center gap-1">
            Feito com <Heart className="h-4 w-4 text-primary fill-primary" /> em Portugal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
