import { Link, useLocation } from "react-router-dom";
import { Menu, User, LogOut } from "lucide-react";
import logo from "@/assets/pede-direto-logo.png";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useHeaderPages } from "@/hooks/useNavigationPages";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./notifications/NotificationBell";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: pages = [] } = useHeaderPages();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Melhor detecção de rota ativa (inclui sub-rotas)
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Pede Direto" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          <Link
            to="/"
            aria-current={isActive("/") ? "page" : undefined}
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Início
          </Link>

          {pages.map((page) => {
            const pagePath = `/pagina/${page.slug}`;
            return (
              <Link
                key={page.id}
                to={pagePath}
                aria-current={isActive(pagePath) ? "page" : undefined}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {page.title}
              </Link>
            );
          })}

          <Link
            to="/blog"
            aria-current={isActive("/blog") ? "page" : undefined}
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Blog
          </Link>

          <Link
            to="/claim-business"
            aria-current={isActive("/claim-business") ? "page" : undefined}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            📢 Registar Negócio
          </Link>

          {user ? (
            <>
              <NotificationBell targetRole={isAdmin ? "admin" : "consumer"} />

              {isAdmin ? (
                <Link
                  to="/admin"
                  aria-current={isActive("/admin") ? "page" : undefined}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  Área Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  aria-current={isActive("/dashboard") ? "page" : undefined}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <User className="h-4 w-4" aria-hidden="true" focusable="false" />
                  Minha Conta
                </Link>
              )}

              <Button type="button" variant="ghost" size="sm" onClick={handleSignOut} className="gap-1">
                <LogOut className="h-4 w-4" aria-hidden="true" focusable="false" />
                Sair
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              aria-current={isActive("/login") ? "page" : undefined}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <User className="h-4 w-4" aria-hidden="true" focusable="false" />
              Entrar
            </Link>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Abrir menu de navegação"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" focusable="false" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent id="mobile-navigation" side="right" className="w-[280px]" aria-label="Menu de navegação móvel">
            <nav className="flex flex-col gap-4 mt-8" aria-label="Navegação móvel">
              <Link
                to="/"
                aria-current={isActive("/") ? "page" : undefined}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Início
              </Link>

              {pages.map((page) => {
                const pagePath = `/pagina/${page.slug}`;
                return (
                  <Link
                    key={page.id}
                    to={pagePath}
                    aria-current={isActive(pagePath) ? "page" : undefined}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {page.title}
                  </Link>
                );
              })}

              <Link
                to="/blog"
                aria-current={isActive("/blog") ? "page" : undefined}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>

              <Link
                to="/claim-business"
                aria-current={isActive("/claim-business") ? "page" : undefined}
                className="text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                📢 Registar Negócio
              </Link>

              {user ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      aria-current={isActive("/admin") ? "page" : undefined}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Área Admin
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      aria-current={isActive("/dashboard") ? "page" : undefined}
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" aria-hidden="true" focusable="false" />
                      Minha Conta
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left inline-flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" focusable="false" />
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  aria-current={isActive("/login") ? "page" : undefined}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-5 w-5" aria-hidden="true" focusable="false" />
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
