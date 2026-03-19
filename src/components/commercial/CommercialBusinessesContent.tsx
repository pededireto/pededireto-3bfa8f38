import { useState } from "react";
import { BusinessWithCategory, useUpdateBusiness, CommercialStatus } from "@/hooks/useBusinesses";
import { useCreateActionRequest } from "@/hooks/useActionRequests";
import { useCreateAuditLog } from "@/hooks/useAuditLogs";
import { useAssignToMe } from "@/hooks/useCommercialPipeline";
import { useAuth } from "@/hooks/useAuth";
import { Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Search, Building2, AlertTriangle, UserCheck, Ban, Handshake, UserPlus, Check } from "lucide-react";
import BusinessFileCard from "@/components/admin/BusinessFileCard";
import { useCommercialAssignments } from "@/hooks/useCommercialPerformance";

interface CommercialBusinessesContentProps {
  businesses: BusinessWithCategory[];
  categories: Category[];
}

const commercialStatusLabels: Record<string, string> = {
  nao_contactado: "Não Contactado",
  contactado: "Contactado",
  interessado: "Interessado",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  cliente: "Cliente",
  perdido: "Perdido",
  followup_agendado: "Follow-Up",
};

const CommercialBusinessesContent = ({ businesses, categories }: CommercialBusinessesContentProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const updateBusiness = useUpdateBusiness();
  const createActionRequest = useCreateActionRequest();
  const createAuditLog = useCreateAuditLog();
  const assignToMe = useAssignToMe();
  const { data: allAssignments = [] } = useCommercialAssignments();

  // Build maps: business_id → assignment info
  const assignmentMap = new Map<string, { commercial_id: string; profileName?: string }>();
  for (const a of allAssignments as any[]) {
    if (a.is_active) {
      assignmentMap.set(a.business_id, {
        commercial_id: a.commercial_id,
        profileName: a.profiles?.full_name || a.profiles?.email,
      });
    }
  }
  const myBusinessIds = new Set(
    (allAssignments as any[])
      .filter((a: any) => a.is_active && a.commercial_id === user?.id)
      .map((a: any) => a.business_id)
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommercialStatus, setFilterCommercialStatus] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithCategory | null>(null);

  const openEditDialog = (business: BusinessWithCategory) => {
    setEditingBusiness(business);
    setDialogOpen(true);
  };

  const handleQuickStatusChange = async (business: BusinessWithCategory, newStatus: CommercialStatus) => {
    try {
      const updates: any = { id: business.id, commercial_status: newStatus };
      if (newStatus === "contactado" && business.commercial_status === "nao_contactado") {
        updates.contacted_at = new Date().toISOString();
      }
      await updateBusiness.mutateAsync(updates);
      await createAuditLog.mutateAsync({
        action: "change_commercial_status",
        target_table: "businesses",
        target_id: business.id,
        target_name: business.name,
        changes: { commercial_status: { old: business.commercial_status, new: newStatus } },
      });
      toast({ title: `Estado alterado para "${commercialStatusLabels[newStatus]}"` });
    } catch {
      toast({ title: "Erro ao alterar estado", variant: "destructive" });
    }
  };

  const handleAssignToMe = async (businessId: string) => {
    try {
      await assignToMe.mutateAsync(businessId);
      toast({ title: "Negócio atribuído a si!" });
    } catch {
      toast({ title: "Erro ao atribuir", variant: "destructive" });
    }
  };

  const handleRequestDelete = async (business: BusinessWithCategory) => {
    try {
      await createActionRequest.mutateAsync({
        action_type: "delete_business",
        target_table: "businesses",
        target_id: business.id,
        target_name: business.name,
        details: `Comercial solicitou remoção do negócio "${business.name}"`,
      });
      toast({ title: "Pedido de remoção enviado", description: "O administrador irá avaliar o pedido." });
    } catch {
      toast({ title: "Erro ao enviar pedido", variant: "destructive" });
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cta_phone?.includes(searchTerm) ||
      b.cta_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCommercial = !filterCommercialStatus || filterCommercialStatus === "all" || b.commercial_status === filterCommercialStatus;
    const matchesOrigin = !filterOrigin || filterOrigin === "all" ||
      (b as any).registration_source === filterOrigin;
    const matchesSub = !filterSubscription || filterSubscription === "all" ||
      (filterSubscription === "free" && b.subscription_status === "inactive") ||
      (filterSubscription === "active" && b.subscription_status === "active") ||
      (filterSubscription === "inactive" && !b.is_active);
    const matchesAssignment = filterAssignment === "all" ||
      (filterAssignment === "mine" && myBusinessIds.has(b.id)) ||
      (filterAssignment === "unassigned" && !myBusinessIds.has(b.id));
    return matchesSearch && matchesCommercial && matchesOrigin && matchesSub && matchesAssignment;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Negócios</h1>
        <p className="text-muted-foreground">Gestão comercial dos negócios da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar negócios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterAssignment} onValueChange={setFilterAssignment}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Atribuição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="mine">Meus</SelectItem>
            <SelectItem value="unassigned">Sem atribuição</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCommercialStatus} onValueChange={setFilterCommercialStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Estado comercial" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            {Object.entries(commercialStatusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            <SelectItem value="self_service">Self-service</SelectItem>
            <SelectItem value="import_excel">Import Excel</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubscription} onValueChange={setFilterSubscription}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Subscrição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="free">Gratuitos</SelectItem>
            <SelectItem value="active">Subscrição ativa</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Businesses Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Ações Rápidas</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary/50" />
                        </div>
                      )}
                      <div>
                        <span className="font-medium block">{business.name}</span>
                        <span className="text-xs text-muted-foreground">{business.cta_phone || business.cta_email || ""}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{business.categories?.name || "-"}</td>
                  <td className="p-4 text-muted-foreground text-sm">{business.city || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="secondary" className={
                        business.commercial_status === "cliente" ? "bg-success/10 text-success" :
                        business.commercial_status === "interessado" ? "bg-warning/10 text-warning" :
                        business.commercial_status === "contactado" ? "bg-primary/10 text-primary" :
                        business.commercial_status === "perdido" ? "bg-destructive/10 text-destructive" :
                        business.commercial_status === "proposta_enviada" ? "bg-warning/10 text-warning" :
                        business.commercial_status === "negociacao" ? "bg-primary/20 text-primary" :
                        business.commercial_status === "followup_agendado" ? "bg-primary/15 text-primary" :
                        "bg-muted text-muted-foreground"
                      }>
                        {commercialStatusLabels[business.commercial_status] || "Não Contactado"}
                      </Badge>
                      {myBusinessIds.has(business.id) && (
                        <Badge variant="outline" className="text-xs">Meu</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {!myBusinessIds.has(business.id) && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAssignToMe(business.id)} disabled={assignToMe.isPending}>
                          <UserPlus className="h-3 w-3 mr-1" /> Atribuir
                        </Button>
                      )}
                      {business.commercial_status === "nao_contactado" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuickStatusChange(business, "contactado")}>
                          <UserCheck className="h-3 w-3 mr-1" /> Contactado
                        </Button>
                      )}
                      {(business.commercial_status === "contactado" || business.commercial_status === "interessado") && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-success border-success/30" onClick={() => handleQuickStatusChange(business, "cliente")}>
                          <Handshake className="h-3 w-3 mr-1" /> Cliente
                        </Button>
                      )}
                      {business.commercial_status !== "perdido" && business.commercial_status !== "cliente" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => handleQuickStatusChange(business, "perdido")}>
                          <Ban className="h-3 w-3 mr-1" /> Perdido
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(business)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-warning hover:text-warning"
                        onClick={() => handleRequestDelete(business)}
                        title="Solicitar remoção"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum negócio encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-right">{filteredBusinesses.length} de {businesses.length} negócios</p>

      {/* Edit Dialog using BusinessFileCard */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingBusiness(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ficha — {editingBusiness?.name}</DialogTitle>
          </DialogHeader>
          {editingBusiness && (
            <BusinessFileCard
              business={editingBusiness}
              categories={categories}
              isAdmin={false}
              onSaved={() => { setDialogOpen(false); setEditingBusiness(null); }}
              onCancel={() => { setDialogOpen(false); setEditingBusiness(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercialBusinessesContent;
