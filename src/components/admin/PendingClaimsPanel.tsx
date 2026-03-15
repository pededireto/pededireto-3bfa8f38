import { Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingClaims, useApproveClaim, useRejectClaim } from "@/hooks/useBusinessClaim";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const PendingClaimsPanel = () => {
  const { toast } = useToast();
  const { data: claims = [], isLoading } = usePendingClaims();
  const approve = useApproveClaim();
  const reject = useRejectClaim();

  const handleApprove = async (claimId: string, businessId: string) => {
    try {
      await approve.mutateAsync({ claimId, businessId });
      toast({ title: "Reclamação aprovada" });
    } catch (error: any) {
      const detail = error?.details || error?.hint || error?.message || "Erro desconhecido";
      const code = error?.code ? ` (${error.code})` : "";
      toast({ title: "Erro ao aprovar reclamação", description: `${detail}${code}`, variant: "destructive" });
      console.error("[PendingClaimsPanel] approve error:", error);
    }
  };

  const handleReject = async (claimId: string) => {
    try {
      await reject.mutateAsync({ claimId });
      toast({ title: "Reclamação rejeitada" });
    } catch (error: any) {
      const detail = error?.details || error?.hint || error?.message || "Erro desconhecido";
      const code = error?.code ? ` (${error.code})` : "";
      toast({ title: "Erro ao rejeitar reclamação", description: `${detail}${code}`, variant: "destructive" });
      console.error("[PendingClaimsPanel] reject error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Reclamações de Negócio (Comercial)</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Pendentes
            {claims.length > 0 && <Badge variant="destructive">{claims.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negócio</TableHead>
                <TableHead>Dono Proposto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">A carregar...</TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sem reclamações pendentes
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.businesses?.name || "—"}</TableCell>
                    <TableCell>{c.claimed_for_name}</TableCell>
                    <TableCell>{c.claimed_for_email}</TableCell>
                    <TableCell>{c.claimed_for_phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(c.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleApprove(c.id, c.business_id)}
                          disabled={approve.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleReject(c.id)}
                          disabled={reject.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingClaimsPanel;
