import { useState } from "react";
import { useActionRequests, useReviewActionRequest } from "@/hooks/useActionRequests";
import { useDeleteBusiness } from "@/hooks/useBusinesses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ClipboardList } from "lucide-react";

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

const ActionRequestsContent = () => {
  const { toast } = useToast();
  const { data: requests = [], isLoading } = useActionRequests();
  const reviewRequest = useReviewActionRequest();
  const deleteBusiness = useDeleteBusiness();

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleReview = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return;
    try {
      await reviewRequest.mutateAsync({
        id: selectedRequest.id,
        status,
        review_note: reviewNote || undefined,
      });

      // If approved and action is delete_business, execute the delete
      if (status === "approved" && selectedRequest.action_type === "delete_business") {
        await deleteBusiness.mutateAsync(selectedRequest.target_id);
      }

      toast({ title: status === "approved" ? "Pedido aprovado" : "Pedido rejeitado" });
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNote("");
    } catch {
      toast({ title: "Erro ao processar pedido", variant: "destructive" });
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const resolvedRequests = requests.filter(r => r.status !== "pending");

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Comerciais</h1>
        <p className="text-muted-foreground">Aprovar ou rejeitar pedidos da equipa comercial</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pendentes ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card p-6 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Sem pedidos pendentes.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Alvo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Detalhes</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="border-t border-border">
                    <td className="p-4 text-sm">{actionLabels[req.action_type] || req.action_type}</td>
                    <td className="p-4 text-sm font-medium">{req.target_name || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{req.details || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => { setSelectedRequest(req); setReviewDialogOpen(true); }}>
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => { setSelectedRequest(req); setReviewNote(""); setReviewDialogOpen(true); }}>
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolvedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Histórico ({resolvedRequests.length})</h2>
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Ação</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Alvo</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Nota</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {resolvedRequests.map((req) => (
                  <tr key={req.id} className="border-t border-border">
                    <td className="p-4 text-sm">{actionLabels[req.action_type] || req.action_type}</td>
                    <td className="p-4 text-sm font-medium">{req.target_name || "-"}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={statusColors[req.status]}>{statusLabels[req.status]}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{req.review_note || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rever Pedido</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Ação:</strong> {actionLabels[selectedRequest.action_type]}</p>
                <p><strong>Alvo:</strong> {selectedRequest.target_name}</p>
                {selectedRequest.details && <p><strong>Detalhes:</strong> {selectedRequest.details}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nota (opcional)</label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Motivo da decisão..." rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="text-destructive" onClick={() => handleReview("rejected")} disabled={reviewRequest.isPending}>
                  Rejeitar
                </Button>
                <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleReview("approved")} disabled={reviewRequest.isPending}>
                  {reviewRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Aprovar e executar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionRequestsContent;
