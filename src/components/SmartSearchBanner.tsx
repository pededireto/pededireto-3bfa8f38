import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Lightbulb, Search, ArrowRight, MapPin, Zap, FileText, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SmartSearchResult } from "@/hooks/useSmartSearch";
import { useAuth } from "@/hooks/useAuth";

interface SmartSearchBannerProps {
  result: SmartSearchResult;
  userCity?: string | null;
  onComplementaryClick?: (service: string) => void;
}

const SmartSearchBanner = ({ result, userCity, onComplementaryClick }: SmartSearchBannerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    isUrgent,
    isSmartMatch,
    searchedTerm,
    resolvedTerms,
    resolvedTerm,
    intentType,
    totalFound,
    complementaryServices,
    primarySolution,
    zeroResults,
  } = result;

  const realZeroResults = zeroResults && !isSmartMatch;
  if (!isSmartMatch && !isUrgent && !realZeroResults) return null;

  const handleComplementaryClick = (service: string) => {
    if (onComplementaryClick) {
      onComplementaryClick(service);
    } else {
      navigate(`/pesquisa?q=${encodeURIComponent(service)}`);
    }
  };

  // Label com todos os termos resolvidos: "pintor, pintores, chapa e pintura"
  const resolvedLabel =
    resolvedTerms && resolvedTerms.length > 0 ? resolvedTerms.join(", ") : (primarySolution ?? resolvedTerm);

  // ── Caso 1: Zero resultados ──────────────────────────────────────────
  if (realZeroResults) {
    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <div className="bg-muted rounded-full p-2 flex-shrink-0">
              <Frown className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                Não encontrámos resultados para <span className="text-primary">"{searchedTerm}"</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Tente outro termo ou explore as categorias abaixo.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["canalizador", "eletricista", "pintor", "restaurante", "cabeleireiro", "dentista"].map((s) => (
              <button
                key={s}
                onClick={() => handleComplementaryClick(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Search className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="default">
              <Link to="/pedir-servico">
                Pedir orçamento gratuito
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Caso 2: Emergência ───────────────────────────────────────────────
  if (isUrgent) {
    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="destructive" className="text-xs gap-1">
                  <Zap className="h-3 w-3" /> Emergência
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Pesquisou <span className="font-semibold text-foreground">"{searchedTerm}"</span>
                </span>
              </div>
              <p className="font-semibold text-base text-red-700 dark:text-red-300">
                Encontrámos{" "}
                <span className="text-red-600 dark:text-red-400">
                  {totalFound} {primarySolution ?? resolvedTerm}
                </span>{" "}
                disponíveis agora
                {userCity && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    em <MapPin className="h-3.5 w-3.5" />
                    {userCity}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <ComplementaryChips services={complementaryServices} onClick={handleComplementaryClick} />
      </div>
    );
  }

  // ── Caso 3: Orçamento ────────────────────────────────────────────────
  if (intentType === "quote") {
    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-2 flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Parece que está a pedir um orçamento</p>
              <p className="font-semibold text-base text-foreground">
                Conectámos com{" "}
                <span className="text-primary">
                  {totalFound} profissionais de {resolvedLabel}
                </span>
              </p>
            </div>
          </div>
        </div>
        <ComplementaryChips services={complementaryServices} onClick={handleComplementaryClick} />
      </div>
    );
  }

  // ── Caso 4: Match inteligente normal ─────────────────────────────────
  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">
              Pesquisou <span className="font-semibold text-foreground">"{searchedTerm}"</span>
            </span>
            <p className="font-semibold text-base text-foreground mt-1">
              A mostrar resultados para <span className="text-primary">{resolvedLabel}</span>
              {userCity && (
                <span className="inline-flex items-center gap-1 ml-1 text-sm font-normal text-muted-foreground">
                  em <MapPin className="h-3.5 w-3.5" />
                  {userCity}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <ComplementaryChips services={complementaryServices} onClick={handleComplementaryClick} />
    </div>
  );
};

// ── Complementary chips ───────────────────────────────────────────────────────

function ComplementaryChips({ services, onClick }: { services: string[]; onClick: (s: string) => void }) {
  if (services.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Pode também precisar de:</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <button
            key={service}
            onClick={() => onClick(service)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Search className="h-3 w-3" />
            {service}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SmartSearchBanner;
