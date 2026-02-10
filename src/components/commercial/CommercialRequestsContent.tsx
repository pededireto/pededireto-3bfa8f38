import { useActionRequests } from "@/hooks/useActionRequests";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const actionLabels: Record<string, string> = {
  delete_business: "Remover negócio",
  delete_category: "Remover categoria",
  edit_category: "Editar categoria",
  delete_subcategory: "Remover subcategoria",
  edit_subcategory: "Editar subcategoria",
  delete_page: "Remover página",
};

const CommercialRequestsContent = () => {
  const { data: requests = [], isLoading } = useActionRequests();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Os Meus Pedidos</h1>
        <p className="text-muted-foreground">Pedidos de ações submetidos ao administrador</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Sem pedidos registados.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Alvo</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Nota</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t border-border">
                  <td className="p-4 text-sm">{actionLabels[req.action_type] || req.action_type}</td>
                  <td className="p-4 text-sm font-medium">{req.target_name || "-"}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className={statusColors[req.status] || ""}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{req.review_note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommercialRequestsContent;
