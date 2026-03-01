import { Link } from "react-router-dom";
import { AlertTriangle, Lightbulb, Search, ArrowRight, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SmartSearchResult } from "@/hooks/useSmartSearch";

interface SmartSearchBannerProps {
  result: SmartSearchResult;
  userCity?: string | null;
}

const SmartSearchBanner = ({ result, userCity }: SmartSearchBannerProps) => {
  if (!result.isSmartMatch) return null;

  const { isUrgent, searchedTerm, resolvedTerm, businesses, complementaryServices, totalFound } = result;

  return (
    <div className="mb-6 space-y-4">
      {/* ── Header do banner ─────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 ${
          isUrgent
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            : "bg-primary/5 border-primary/20"
        }`}
      >
        <div className="flex items-start gap-3">
          {isUrgent ? (
            <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-2 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isUrgent && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Zap className="h-3 w-3" /> Urgente
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Pesquisou por{" "}
                <span className="font-semibold text-foreground">"{searchedTerm}"</span>
              </span>
            </div>

            <p className={`font-semibold text-base ${isUrgent ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>
              {totalFound > 0 ? (
                <>
                  Encontrámos{" "}
                  <span className={isUrgent ? "text-red-600 dark:text-red-400" : "text-primary"}>
                    {totalFound} {resolvedTerm}
                    {totalFound !== 1 ? "es" : ""}
                  </span>
                  {userCity ? (
                    <>
                      {" "}em{" "}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {userCity}
                      </span>
                    </>
                  ) : (
                    " disponíveis"
                  )}
                </>
              ) : (
                <>
                  Não encontrámos{" "}
                  <span className="text-muted-foreground">{resolvedTerm}</span>{" "}
                  {userCity ? `em ${userCity}` : "na sua zona"}
                  {" — mas pode pedir um orçamento"}
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Negócios encontrados (mini cards) ───────────────────────── */}
        {businesses.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {businesses.slice(0, 6).map((biz) => (
              <Link
                key={biz.id}
                to={`/negocio/${biz.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
              >
                {/* Logo ou inicial */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {biz.logo_url ? (
                    <img
                      src={biz.logo_url}
                      alt={biz.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-primary/40">
                      {biz.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {biz.name}
                  </p>
                  {biz.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {biz.city}
                    </p>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}

        {/* ── CTA se houver mais resultados ───────────────────────────── */}
        {businesses.length > 6 && (
          <p className="mt-3 text-sm text-muted-foreground text-center">
            e mais {businesses.length - 6} profissionais disponíveis nos resultados abaixo
          </p>
        )}

        {/* ── CTA se 0 resultados → pedir orçamento ───────────────────── */}
        {businesses.length === 0 && (
          <div className="mt-4">
            <Button asChild size="sm" variant={isUrgent ? "destructive" : "default"}>
              <Link to="/pedir-servico">
                Pedir orçamento gratuito
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Serviços complementares sugeridos ──────────────────────────────── */}
      {complementaryServices.length > 0 && (
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Pode também precisar de:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {complementaryServices.map((service) => (
              <Link
                key={service}
                to={`/pesquisa?q=${encodeURIComponent(service)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Search className="h-3 w-3" />
                {service}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearchBanner;
