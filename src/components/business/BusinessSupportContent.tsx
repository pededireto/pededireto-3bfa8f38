import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BusinessSupportContent = ({ businessId }: { businessId: string }) => {
  const phone = "351922019685";
  const message = encodeURIComponent(
    "Olá, sou vosso cliente e preciso da vossa ajuda para resolver uma questão, podem ajudar?",
  );

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suporte PedeDireto</h1>
        <p className="text-sm text-muted-foreground">A equipa responde normalmente em menos de 2h úteis</p>
      </div>

      <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Precisas de ajuda? Fala diretamente com a nossa equipa pelo WhatsApp.
        </p>
        <Button onClick={handleWhatsApp} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Abrir WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default BusinessSupportContent;
