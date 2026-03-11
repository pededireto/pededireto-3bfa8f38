import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliateCode } from "@/hooks/useAffiliateCode";
import { useAffiliateLeads } from "@/hooks/useAffiliateLeads";
import { useAffiliateCommissions } from "@/hooks/useAffiliateCommissions";
import { useAffiliateStats } from "@/hooks/useAffiliateStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, Check, Users, TrendingUp, DollarSign, Target } from "lucide-react";
import ActiveCampaignBanner from "./ActiveCampaignBanner";
import AddLeadFullModal from "./AddLeadFullModal";
import AffiliateLeadsTable from "./AffiliateLeadsTable";
import AffiliateCommissionsTable from "./AffiliateCommissionsTable";
import PayoutRequestModal from "./PayoutRequestModal";

interface AffiliatePortalContentProps {
  showBackButton?: boolean;
  backTo?: string;
}

const AffiliatePortalContent = ({ showBackButton, backTo = "/dashboard" }: AffiliatePortalContentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: code, isLoading: codeLoading } = useAffiliateCode();
  const { data: leads = [], isLoading: leadsLoading } = useAffiliateLeads();
  const { data: commissions = [], isLoading: commissionsLoading } = useAffiliateCommissions();
  const { data: stats } = useAffiliateStats();

  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payoutModal, setPayoutModal] = useState<{ open: boolean; commissionId: string; amount: number } | null>(null);

  const referralUrl = code ? `https://pededireto.pt/?ref=${code}` : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = codeLoading || leadsLoading || commissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find approved commissions eligible for payout
  const approvedCommissions = commissions.filter((c: any) => c.status === "approved");

  return (
    <div className="space-y-6">
      {showBackButton && (
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar ao meu perfil
        </Link>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">🤝 Programa de Afiliados</h1>
        <p className="text-muted-foreground">Regista negócios e ganha comissões quando subscrevem.</p>
      </div>

      {/* Campaign Banner */}
      <ActiveCampaignBanner />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Leads</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Convertidas</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.converted || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Pendente</span>
          </div>
          <p className="text-2xl font-bold">{(stats?.pendingAmount || 0).toFixed(2)}€</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Pago</span>
          </div>
          <p className="text-2xl font-bold text-primary">{(stats?.paidAmount || 0).toFixed(2)}€</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-semibold mb-3">🔗 O teu link de referral</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm font-mono truncate">
                {referralUrl || "A gerar..."}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy} disabled={!referralUrl}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Código: <Badge variant="outline" className="font-mono">{code || "..."}</Badge>
            </p>
          </div>
          <div className="flex-shrink-0">
            {referralUrl && (
              <div className="bg-white p-2 rounded-lg inline-block">
                <QRCodeSVG value={referralUrl} size={100} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions + Tabs */}
      <div className="flex items-center justify-between">
        <Button onClick={() => setAddLeadOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registar Lead
        </Button>
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="commissions">Comissões ({commissions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <AffiliateLeadsTable leads={leads} />
          </div>
        </TabsContent>
        <TabsContent value="commissions">
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <AffiliateCommissionsTable commissions={commissions} />
          </div>
          {approvedCommissions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Comissões aprovadas — solicitar pagamento:</p>
              {approvedCommissions.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-card rounded-lg p-3 shadow-card">
                  <span className="text-sm">
                    {c.commission_type === "first" ? "1ª Conversão" : "Renovação"} — <strong>{Number(c.commission_amount).toFixed(2)}€</strong>
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setPayoutModal({ open: true, commissionId: c.id, amount: Number(c.commission_amount) })}
                  >
                    Solicitar Pagamento
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddLeadModal open={addLeadOpen} onOpenChange={setAddLeadOpen} />

      {payoutModal?.open && user?.id && (
        <PayoutRequestModal
          open={payoutModal.open}
          onOpenChange={(open) => setPayoutModal(open ? payoutModal : null)}
          commissionId={payoutModal.commissionId}
          affiliateId={user.id}
          amount={payoutModal.amount}
        />
      )}
    </div>
  );
};

export default AffiliatePortalContent;
