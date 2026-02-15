import { AlertCircle, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UnclaimedBusinessBannerProps {
  businessId: string;
  claimStatus?: string;
}

const UnclaimedBusinessBanner = ({ 
  businessId, 
  claimStatus = "unclaimed" 
}: UnclaimedBusinessBannerProps) => {
  // Se for verified, não mostra nada (o banner "Você já está associado" é renderizado no BusinessPage)
  if (claimStatus === "verified") {
    return null;
  }

  // Para pending - pedido em análise
  if (claimStatus === "pending") {
    return (
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">
                Este negócio tem um pedido de reclamação pendente
              </p>
              <p className="text-sm text-blue-700">
                A verificação está em análise pela nossa equipa.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Para unclaimed - negócio não reclamado (padrão)
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">
                É o dono deste negócio?
              </p>
              <p className="text-sm text-amber-700">
                Reclame esta página gratuitamente e tenha controlo total sobre as suas informações.
              </p>
            </div>
          </div>
          <Link to={`/reclamar/${businessId}`}>
            <Button size="sm" variant="default" className="gap-2">
              <Building2 className="w-4 h-4" />
              Reclamar Negócio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnclaimedBusinessBanner;
