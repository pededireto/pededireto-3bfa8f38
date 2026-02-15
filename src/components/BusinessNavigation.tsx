import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessNavigationProps {
  previousBusiness?: { slug: string; name: string } | null;
  nextBusiness?: { slug: string; name: string } | null;
  isLastBusiness?: boolean;
  currentPosition?: number;
  totalBusinesses?: number;
  onShowSuggestionForm?: () => void;
}

const BusinessNavigation = ({
  previousBusiness,
  nextBusiness,
  isLastBusiness,
  currentPosition = 0,
  totalBusinesses = 0,
  onShowSuggestionForm,
}: BusinessNavigationProps) => {
  // Se não há navegação disponível, não mostra nada
  if (!previousBusiness && !nextBusiness && !isLastBusiness) {
    return null;
  }

  return (
    <div className="border-t bg-muted/30">
      <div className="container py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Botão Anterior */}
          <div className="flex-1">
            {previousBusiness ? (
              <Link to={`/negocio/${previousBusiness.slug}`}>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto h-auto py-3">
                  <ChevronLeft className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Anterior</p>
                    <p className="font-medium truncate max-w-[200px]">
                      {previousBusiness.name}
                    </p>
                  </div>
                </Button>
              </Link>
            ) : (
              <div /> // Placeholder para manter layout
            )}
          </div>

          {/* Contador (centro) */}
          {totalBusinesses > 0 && (
            <div className="text-center hidden sm:block">
              <p className="text-sm text-muted-foreground">
                {currentPosition} de {totalBusinesses + 1}
              </p>
            </div>
          )}

          {/* Botão Próximo ou Sugestão */}
          <div className="flex-1 flex justify-end">
            {nextBusiness ? (
              <Link to={`/negocio/${nextBusiness.slug}`}>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto h-auto py-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Próximo</p>
                    <p className="font-medium truncate max-w-[200px]">
                      {nextBusiness.name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : isLastBusiness ? (
              <Button 
                size="lg"
                variant="default" 
                className="gap-2"
                onClick={onShowSuggestionForm}
              >
                Sugerir Negócio
              </Button>
            ) : null}
          </div>
        </div>

        {/* Banner quando chega ao fim */}
        {isLastBusiness && (
          <div className="mt-6 p-4 bg-card rounded-lg border text-center">
            <p className="font-medium mb-2">
              Não existem mais negócios nesta categoria
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Não encontrou a empresa ou serviço que pretendia?
            </p>
            <Button 
              size="lg"
              onClick={onShowSuggestionForm}
              className="gap-2"
            >
              Deixe-nos a sua sugestão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessNavigation;
