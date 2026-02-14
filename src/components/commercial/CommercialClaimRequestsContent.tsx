import { Loader2, ShieldCheck } from "lucide-react";
import { useClaimRequests } from "@/hooks/useClaimRequests";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusBadge = (status: string | null) => {
  switch (status) {
    case "pending": return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">Pendente</Badge>;
    case "verified": return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">Verificado</Badge>;
    case "rejected": return <Badge variant="destructive">Rejeitado</Badge>;
    case "revoked": return <Badge variant="secondary">Revogado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const CommercialClaimRequestsContent = () => {
  const { data: claims = [], isLoading } = useClaimRequests();
  const pendingClaims = claims.filter(c => c.claim_status === "pending");

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
        <Badge variant="outline" className="ml-2">{pendingClaims.length} pendentes</Badge>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Sem pedidos de claim pendentes.
                </TableCell>
              </TableRow>
            ) : (
              pendingClaims.map((claim) => (
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CommercialClaimRequestsContent;
