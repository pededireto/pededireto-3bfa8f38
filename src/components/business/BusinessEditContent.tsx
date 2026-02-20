import { useState } from "react";
import { Edit3, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BusinessOwnerEditForm from "@/components/business/BusinessOwnerEditForm";

interface BusinessEditContentProps {
  business: any;
}

const BusinessEditContent = ({ business }: BusinessEditContentProps) => {
  const [saved, setSaved] = useState(false);

  const handleSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Editar Negócio</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Guardado!
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/negocio/${business.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Ver página pública
            </a>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Edita as informações do teu negócio. As alterações ficam visíveis na plataforma imediatamente após guardar.
      </p>

      {/* Form */}
      <BusinessOwnerEditForm business={business} onSaved={handleSaved} />
    </div>
  );
};

export default BusinessEditContent;
