import { useBusinessRequests } from "@/hooks/useBusinessDashboard";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox, MapPin, Phone, Mail, AlertTriangle, User } from "lucide-react";

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
        <div className="space-y-4">
          {requests.map((match: any) => {
            const sr = match.service_requests;
            const profile = sr?.profiles;
            const isUrgent = sr?.urgency === "urgent";

            return (
              <div key={match.id} className="bg-card rounded-xl p-5 shadow-card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    {isUrgent && (
                      <div className="flex items-center gap-1 text-destructive text-xs font-semibold mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> URGENTE
                      </div>
                    )}
                    <p className="font-medium text-foreground">
                      {sr?.description || "Pedido sem descrição"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sr?.categories?.name}{sr?.subcategories?.name ? ` • ${sr.subcategories.name}` : ""}
                    </p>
                  </div>
                  <Badge variant={match.status === "respondido" ? "default" : "secondary"}>
                    {match.status}
                  </Badge>
                </div>

                {/* Consumer info */}
                {profile && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Consumidor</p>
                    {profile.full_name && (
                      <div className="flex items-center gap-2 text-foreground">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {profile.full_name}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${profile.email}`} className="text-primary hover:underline">{profile.email}</a>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`tel:${profile.phone}`} className="text-primary hover:underline">{profile.phone}</a>
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {(sr?.location_city || sr?.location_postal_code || sr?.address) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[sr?.address, sr?.location_city, sr?.location_postal_code].filter(Boolean).join(", ")}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {new Date(match.sent_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessRequestsContent;
