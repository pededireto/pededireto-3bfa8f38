import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  businessId: string;
  claimStatus?: string | null;
}

export function UnclaimedBusinessBanner({ businessId, claimStatus }: Props) {
  const navigate = useNavigate();

  // Se for verified, não mostra nada
  if (claimStatus === "verified") return null;

  // Para pending - pedido em análise
  if (claimStatus === "pending") {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-400">
              Pedido de reclamação pendente
            </p>
            <p className="text-sm text-muted-foreground">
              Este negócio tem um pedido de reclamação em análise pela nossa equipa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Para unclaimed - negócio não reclamado (padrão)
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-yellow-400">
            Negócio não reclamado
          </p>
          <p className="text-sm text-muted-foreground">
            Este negócio ainda não está a ser gerido pelo proprietário.
            É o seu negócio? Reclame gratuitamente e comece a receber clientes.
          </p>
        </div>
      </div>
      <Button
        onClick={() => navigate(`/claim-business?business_id=${businessId}`)}
        className="btn-cta-primary gap-2 flex-shrink-0"
      >
        <Building2 className="w-4 h-4" />
        Reclamar Negócio
      </Button>
    </div>
  );
}
