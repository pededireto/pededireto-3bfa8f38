import { useState } from "react";
import { Loader2, ShieldCheck, Check, X, Ban } from "lucide-react";
import { useClaimRequests, useApproveClaim, useRejectClaim, useRevokeClaim } from "@/hooks/useClaimRequests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const statusBadge = (status: string | null) => {
  switch (status) {
    case "pending": return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">Pendente</Badge>;
    case "verified": return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">Verificado</Badge>;
    case "rejected": return <Badge variant="destructive">Rejeitado</Badge>;
    case "revoked": return <Badge variant="secondary">Revogado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const ClaimRequestsContent = () => {
  const { data: claims = [], isLoading } = useClaimRequests();
  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();
  const revokeMutation = useRevokeClaim();

  const [dialogAction, setDialogAction] = useState<"reject" | "revoke" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const openNotesDialog = (action: "reject" | "revoke", businessId: string) => {
    setDialogAction(action);
    setSelectedId(businessId);
    setNotes("");
  };

  const confirmAction = () => {
    if (!selectedId || !notes.trim()) return;
    if (dialogAction === "reject") {
      rejectMutation.mutate({ businessId: selectedId, notes });
    } else if (dialogAction === "revoke") {
      revokeMutation.mutate({ businessId: selectedId, notes });
    }
    setDialogAction(null);
    setSelectedId(null);
    setNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Pedidos de Claim</h1>
        <Badge variant="outline" className="ml-2">
          {claims.filter(c => c.claim_status === "pending").length} pendentes
        </Badge>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Negócio</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Reclamado por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Sem pedidos de claim.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.name}</TableCell>
                  <TableCell>{claim.city || "—"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{claim.requester_name || "—"}</p>
                      <p className="text-muted-foreground text-xs">{claim.requester_email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {claim.claim_requested_at
                      ? new Date(claim.claim_requested_at).toLocaleDateString("pt-PT")
                      : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(claim.claim_status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {claim.claim_review_notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {claim.claim_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approveMutation.mutate({ businessId: claim.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openNotesDialog("reject", claim.id)}
                          >
                            <X className="h-4 w-4 mr-1" /> Rejeitar
                          </Button>
                        </>
                      )}
                      {claim.claim_status === "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNotesDialog("revoke", claim.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" /> Revogar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "reject" ? "Rejeitar Claim" : "Revogar Claim"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Notas obrigatórias (motivo)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAction(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmAction}
              disabled={!notes.trim() || rejectMutation.isPending || revokeMutation.isPending}
            >
              {dialogAction === "reject" ? "Rejeitar" : "Revogar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClaimRequestsContent;
