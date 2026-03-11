import { useState } from "react";
import {
  useAllAffiliateLeads,
  useAllAffiliateCommissions,
  useAllAffiliateCodes,
  useUpdateLeadStatus,
  useApproveCommission,
  useCancelCommission,
  useMarkCommissionPaidAffiliate,
} from "@/hooks/useAdminAffiliates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  contacted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  converted: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
  duplicate: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-destructive/10 text-destructive",
};

const AffiliateAdminContent = () => {
  const { toast } = useToast();
  const { data: leads = [], isLoading: leadsLoading } = useAllAffiliateLeads();
  const { data: commissions = [], isLoading: commissionsLoading } = useAllAffiliateCommissions();
  const { data: codes = [], isLoading: codesLoading } = useAllAffiliateCodes();

  const updateLeadStatus = useUpdateLeadStatus();
  const approveCommission = useApproveCommission();
  const cancelCommission = useCancelCommission();
  const markPaid = useMarkCommissionPaidAffiliate();

  const [leadFilter, setLeadFilter] = useState("all");
  const [commissionFilter, setCommissionFilter] = useState("all");
  const [paymentRef, setPaymentRef] = useState("");

  const filteredLeads = leads.filter((l: any) => leadFilter === "all" || l.status === leadFilter);
  const filteredCommissions = commissions.filter((c: any) => commissionFilter === "all" || c.status === commissionFilter);

  const handleLeadStatus = async (id: string, status: string) => {
    try {
      await updateLeadStatus.mutateAsync({ id, status });
      toast({ title: `Lead marcada como ${status}` });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await.(approveCommission as any).mutateAsync(id);
      toast({ title: "Comissão aprovada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    if     (!confirm("Cancelar esta comissão?")) return;
    try {
      await cancelCommission.mutateAsync(id);
      toast({ title: "Comissão cancelada" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markPaid.mutateAsync({ id, payment_reference: paymentRef || undefined });
      toast({ title: "Comissão marcada como paga" });
      setPaymentRef("");
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const isLoading = leadsLoading || commissionsLoading || codesLoading;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Affiliate stats aggregation
  const affiliateMap = new Map<string, { code: string; leads: number; converted: number; totalGenerated: number; totalPaid: number }>();
  for (const c of codes as any[]) {
    affiliateMap.set(c.user_id, { code: c.code, leads: 0, converted: 0, totalGenerated: 0, totalPaid: 0 });
  }
  for (const l of leads as any[]) {
    const entry = affiliateMap.get(l.affiliate_id);
    if (entry) {
      entry.leads++;
      if (l.status === "converted") entry.converted++;
    }
  }
  for (const c of commissions as any[]) {
    const entry = affiliateMap.get(c.affiliate_id);
    if (entry) {
      entry.totalGenerated += Number(c.commission_amount);
      if (c.status === "paid") entry.totalPaid += Number(c.commission_amount);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">🤝 Gestão de Afiliados</h1>
        <p className="text-muted-foreground">Gerir afiliados, leads e comissões</p>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Afiliados ({codes.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="commissions">Comissões ({commissions.length})</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          <div className="bg-card rounded-xl shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">User ID</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Leads</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Convertidas</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total Gerado</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total Pago</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(affiliateMap.entries()).map(([userId, data]) => (
                  <tr key={userId} className="border-t border-border">
                    <td className="p-3 font-mono font-medium">{data.code}</td>
                    <td className="p-3 text-muted-foreground text-xs truncate max-w-[150px]">{userId}</td>
                    <td className="p-3 text-right">{data.leads}</td>
                    <td className="p-3 text-right">{data.converted}</td>
                    <td className="p-3 text-right font-medium">{data.totalGenerated.toFixed(2)}€</td>
                    <td className="p-3 text-right font-medium text-primary">{data.totalPaid.toFixed(2)}€</td>
                  </tr>
                ))}
                {affiliateMap.size === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem afiliados registados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <div className="flex gap-2 mb-4">
            <Select value={leadFilter} onValueChange={setLeadFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novas</SelectItem>
                <SelectItem value="contacted">Contactadas</SelectItem>
                <SelectItem value="converted">Convertidas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-card rounded-xl shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Negócio</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Contacto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cidade</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((l: any) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3 font-medium">{l.business_name}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {l.contact_phone || l.contact_email || l.contact_website || "-"}
                    </td>
                    <td className="p-3 text-muted-foreground">{l.city || "-"}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className={statusColors[l.status] || ""}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-PT")}</td>
                    <td className="p-3 text-right">
                      {l.status === "new" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleLeadStatus(l.id, "contacted")}>
                            Contactada
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleLeadStatus(l.id, "rejected")}>
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sem leads.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <div className="flex gap-2 mb-4">
            <Select value={commissionFilter} onValueChange={setCommissionFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Ref. pagamento"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="bg-card rounded-xl shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Método</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">IBAN</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3">
                      <Badge variant="outline">{c.commission_type === "first" ? "1ª" : "Renov."}</Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">{Number(c.commission_amount).toFixed(2)}€</td>
                    <td className="p-3">
                      <Badge variant="secondary" className={statusColors[c.status] || ""}>{c.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{c.payment_method || "-"}</td>
                    <td className="p-3 text-muted-foreground text-xs font-mono">{c.iban || "-"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-PT")}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {c.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApprove(c.id)}>
                              <Check className="h-3 w-3 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(c.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <Button size="sm" onClick={() => handleMarkPaid(c.id)}>
                            <DollarSign className="h-3 w-3 mr-1" /> Pago
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCommissions.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sem comissões.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateAdminContent;
