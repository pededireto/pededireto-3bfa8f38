import { Link } from "react-router-dom";
import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useHeaderPages } from "@/hooks/useNavigationPages";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: pages = [] } = useHeaderPages();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">Pede Direto</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Início
          </Link>
          {pages.map((page) => (
            <Link
              key={page.id}
              to={`/pagina/${page.slug}`}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {page.title}
            </Link>
          ))}
          <Link to="/claim-business" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            📢 Registar Negócio
          </Link>
          {user ? (
            <>
              {isAdmin ? (
                <Link to="/admin" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                  Área Admin
                </Link>
              ) : (
                <Link to="/dashboard" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Minha Conta
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1">
              <User className="h-4 w-4" />
              Entrar
            </Link>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                Início
              </Link>
              {pages.map((page) => (
                <Link
                  key={page.id}
                  to={`/pagina/${page.slug}`}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {page.title}
                </Link>
              ))}
              <Link to="/claim-business" className="text-lg font-medium text-primary hover:text-primary/80 transition-colors" onClick={() => setIsOpen(false)}>
                📢 Registar Negócio
              </Link>
              {user ? (
                <>
                  {isAdmin ? (
                    <Link to="/admin" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                      Área Admin
                    </Link>
                  ) : (
                    <Link to="/dashboard" className="text-lg font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-2" onClick={() => setIsOpen(false)}>
                      <User className="h-5 w-5" />
                      Minha Conta
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left inline-flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-lg font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <User className="h-5 w-5" />
                  Entrar
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
