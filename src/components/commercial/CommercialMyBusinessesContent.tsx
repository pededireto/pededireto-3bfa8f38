import { useMyPipeline, PIPELINE_PHASES } from "@/hooks/useCommercialPipeline";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import CommercialBusinessSheet from "./CommercialBusinessSheet";

const CommercialMyBusinessesContent = () => {
  const { data: pipeline = [], isLoading } = useMyPipeline();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">🏢 Meus Negócios</h1>
        <p className="text-muted-foreground">{pipeline.length} negócios atribuídos a si</p>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Fase</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Próx. Follow-up</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Receita</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((item) => {
                const biz = item.businesses;
                const phaseConf = PIPELINE_PHASES.find(p => p.value === item.phase);
                return (
                  <tr
                    key={item.id}
                    className="border-t border-border cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedBusinessId(item.business_id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {biz?.logo_url ? (
                          <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary/50" />
                          </div>
                        )}
                        <span className="font-medium">{biz?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{biz?.city || "—"}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{biz?.categories?.name || "—"}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={cn("text-xs", phaseConf?.color)}>
                        {phaseConf?.emoji} {phaseConf?.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.next_followup_date
                        ? new Date(item.next_followup_date).toLocaleDateString("pt-PT")
                        : "—"}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {biz?.subscription_status === "active" ? `${Number(biz.subscription_price || 0).toFixed(2)}€` : "Gratuito"}
                    </td>
                  </tr>
                );
              })}
              {pipeline.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Sem negócios atribuídos. Vá a "Negócios" e clique em "Atribuir" para adicionar.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CommercialBusinessSheet
        businessId={selectedBusinessId}
        onClose={() => setSelectedBusinessId(null)}
      />
    </div>
  );
};

export default CommercialMyBusinessesContent;
