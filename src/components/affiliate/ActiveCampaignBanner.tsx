import { useActiveCommissionModel } from "@/hooks/useActiveCommissionModel";
import { Megaphone } from "lucide-react";

const ActiveCampaignBanner = () => {
  const { data: model, isLoading } = useActiveCommissionModel();

  if (isLoading) return null;

  if (!model) {
    return (
      <div className="rounded-xl bg-muted p-5 flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-muted-foreground" />
        <div>
          <p className="font-semibold text-muted-foreground">Nenhuma campanha activa de momento</p>
          <p className="text-sm text-muted-foreground">Contacta o administrador para mais informações.</p>
        </div>
      </div>
    );
  }

  const validUntil = model.valid_until
    ? new Date(model.valid_until).toLocaleDateString("pt-PT")
    : null;

  return (
    <div className="rounded-xl bg-primary p-5 text-primary-foreground">
      <div className="flex items-center gap-3 mb-2">
        <Megaphone className="h-6 w-6" />
        <h3 className="font-bold text-lg">🎯 CAMPANHA ACTIVA</h3>
      </div>
      <p className="text-lg font-semibold">{model.name}</p>
      <div className="flex flex-wrap gap-4 mt-2 text-sm opacity-90">
        <span>💰 One-shot: <strong>{model.rate || 0}%</strong></span>
        <span>🔄 Renovação: <strong>{model.renewal_rate || 0}%</strong></span>
        {validUntil && <span>📅 Válido até: <strong>{validUntil}</strong></span>}
        {!model.valid_until && <span>📅 Sem expiração</span>}
      </div>
      {model.description && (
        <p className="mt-2 text-sm opacity-80">{model.description}</p>
      )}
    </div>
  );
};

export default ActiveCampaignBanner;
