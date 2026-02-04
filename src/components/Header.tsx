import { Link } from "react-router-dom";
import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary">Pede Direto</span>
            <span className="text-[10px] text-muted-foreground -mt-1">Do restaurante para ti.</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Restaurantes
          </Link>
          <Link 
            to="/como-funciona" 
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Como Funciona
          </Link>
          <Link 
            to="/admin" 
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Área Parceiros
          </Link>
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
              <Link 
                to="/" 
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Restaurantes
              </Link>
              <Link 
                to="/como-funciona" 
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Como Funciona
              </Link>
              <Link 
                to="/admin" 
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Área Parceiros
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
