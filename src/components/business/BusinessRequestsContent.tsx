import { useBusinessRequests } from "@/hooks/useBusinessDashboard";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox } from "lucide-react";

interface Props { businessId: string; }

const BusinessRequestsContent = ({ businessId }: Props) => {
  const { data: requests = [], isLoading } = useBusinessRequests(businessId);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Recebidos</h1>
        <p className="text-muted-foreground">Pedidos de orçamento e serviços</p>
      </div>
      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Sem pedidos recebidos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((match: any) => (
            <div key={match.id} className="bg-card rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{match.service_requests?.description || "Pedido sem descrição"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {match.service_requests?.categories?.name} {match.service_requests?.subcategories?.name ? `• ${match.service_requests.subcategories.name}` : ""}
                  </p>
                  {match.service_requests?.address && <p className="text-sm text-muted-foreground">{match.service_requests.address}</p>}
                </div>
                <Badge variant={match.status === "respondido" ? "default" : "secondary"}>{match.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{new Date(match.sent_at).toLocaleDateString("pt-PT")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessRequestsContent;
