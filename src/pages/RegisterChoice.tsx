import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/pede-direto-logo.png";
import { Search, Building2, ArrowLeft } from "lucide-react";

const RegisterChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Pede Direto" className="h-10" />
            </Link>
            <h2 className="text-xl font-semibold text-foreground">Criar Conta</h2>
            <p className="text-muted-foreground mt-1">Como queres usar o PedeDireto?</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/registar/consumidor")}
              className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-secondary/50 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Quero encontrar serviços</p>
                <p className="text-sm text-muted-foreground">Pesquisar, guardar favoritos e pedir orçamentos</p>
              </div>
            </button>

            <button
              onClick={() => {
                localStorage.setItem("postLoginRedirect", "/claim-business");
                navigate("/claim-business");
              }}
              className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Quero promover o meu negócio</p>
                <p className="text-sm text-muted-foreground">Reclamar ficha, gerir perfil e receber leads</p>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Já tens conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterChoice;
