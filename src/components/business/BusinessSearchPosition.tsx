import { Search, TrendingUp, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBusinessSearchPosition } from "@/hooks/useBusinessSearchPosition";

interface BusinessSearchPositionProps {
  businessId: string;
  canViewPro: boolean;
  onUpgradeClick?: () => void;
}

const positionColor = (pos: number | null) => {
  if (pos === null) return "text-muted-foreground";
  if (pos <= 3) return "text-green-500";
  if (pos <= 7) return "text-yellow-500";
  return "text-red-400";
};

const positionLabel = (pos: number | null) => {
  if (pos === null) return "—";
  if (pos <= 3) return `#${pos} 🏆`;
  if (pos <= 7) return `#${pos}`;
  return `#${pos}`;
};

const BusinessSearchPosition = ({ businessId, canViewPro, onUpgradeClick }: BusinessSearchPositionProps) => {
  const { data, isLoading } = useBusinessSearchPosition(canViewPro ? businessId : null);

  if (isLoading) return null;

  return (
    <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Posição nas Pesquisas</p>
      </div>

      {/* PRO: conteúdo real */}
      {canViewPro && data && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-xl font-bold text-foreground">{data.total_searches_found}</p>
              <p className="text-xs text-muted-foreground mt-0.5">vezes encontrado</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-xl font-bold text-foreground">{data.top_terms.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">termos diferentes</p>
            </div>
          </div>

          {/* Sem dados ainda */}
          {data.total_searches_found === 0 && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Ainda sem dados de pesquisa suficientes.<br />
                Os dados aparecem à medida que clientes encontram o teu negócio.
              </p>
            </div>
          )}

          {/* Top termos */}
          {data.top_terms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Termos que te encontraram
              </p>
              {data.top_terms.map((item) => (
                <div key={item.term} className="flex items-center gap-3 text-xs">
                  <span className="flex-1 truncate text-foreground font-medium">{item.term}</span>
                  <span className="text-muted-foreground">{item.appearances}x</span>
                  <span className={`font-bold w-10 text-right ${positionColor(item.avg_position)}`}>
                    {positionLabel(item.avg_position)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Dica de melhoria */}
          {data.top_terms.some(t => t.avg_position !== null && t.avg_position > 5) && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
              <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Completa o perfil e adiciona mais subcategorias para subir nas pesquisas.</span>
            </div>
          )}
        </>
      )}

      {/* SEM PRO: blur + CTA */}
      {!canViewPro && (
        <div className="relative">
          {/* Preview em blur */}
          <div className="space-y-2 select-none pointer-events-none opacity-40 blur-sm">
            {[
              { term: "entregas rápidas", appearances: 12, avg_position: 2 },
              { term: "delivery lisboa", appearances: 8, avg_position: 4 },
              { term: "encomendas urgentes", appearances: 5, avg_position: 7 },
            ].map((item) => (
              <div key={item.term} className="flex items-center gap-3 text-xs">
                <span className="flex-1 text-foreground font-medium">{item.term}</span>
                <span className="text-muted-foreground">{item.appearances}x</span>
                <span className="font-bold text-green-500 w-10 text-right">#{item.avg_position}</span>
              </div>
            ))}
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 rounded-lg backdrop-blur-[1px]">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center px-4">
              Vê em que posição apareces quando alguém pesquisa o teu serviço
            </p>
            <Button size="sm" className="text-xs px-4" onClick={onUpgradeClick}>
              Melhorar Plano
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSearchPosition;
