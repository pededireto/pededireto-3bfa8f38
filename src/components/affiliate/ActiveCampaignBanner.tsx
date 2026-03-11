import { useActiveCommissionModel } from "@/hooks/useActiveCommissionModel";
import { Megaphone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_ADMIN_URL = "https://api.whatsapp.com/send?phone=351210203862&text=Gostaria%20de%20saber%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20programa%20de%20afiliados";

const ActiveCampaignBanner = () => {
  const { data: model, isLoading } = useActiveCommissionModel();

  if (isLoading) return null;

  if (!model) {
    return (
      <div className="rounded-xl bg-muted p-5 flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-semibold text-muted-foreground">Nenhuma campanha activa de momento</p>
          <p className="text-sm text-muted-foreground">Contacta o administrador para mais informações.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 flex-shrink-0">
          <a href={WHATSAPP_ADMIN_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Falar com Admin
          </a>
        </Button>
      </div>
    );
  }

  const ratePercent = Number(model.rate) < 1 ? (Number(model.rate) * 100).toFixed(0) : Number(model.rate).toFixed(0);
  const renewalPercent = Number(model.renewal_rate) < 1 ? (Number(model.renewal_rate) * 100).toFixed(0) : Number(model.renewal_rate).toFixed(0);

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
        <span>💰 One-shot: <strong>{ratePercent}%</strong></span>
        <span>🔄 Renovação: <strong>{renewalPercent}%</strong></span>
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
