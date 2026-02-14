import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  businessId: string;
  claimStatus?: string | null;
}

export function UnclaimedBusinessBanner({ businessId, claimStatus }: Props) {
  const navigate = useNavigate();

  if (claimStatus === "verified") return null;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
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
        onClick={() => navigate(`/claim-business/${businessId}`)}
        className="btn-cta-primary"
      >
        Reclamar Negócio
      </Button>
    </div>
  );
}
