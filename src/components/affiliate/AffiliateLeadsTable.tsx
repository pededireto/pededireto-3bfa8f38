import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  business_name: string;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_website: string | null;
  status: string;
  source: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Nova", className: "bg-muted text-muted-foreground" },
  contacted: { label: "Contactada", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  converted: { label: "Convertida ✓", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  rejected: { label: "Rejeitada", className: "bg-destructive/10 text-destructive" },
  duplicate: { label: "Duplicada", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

const AffiliateLeadsTable = ({ leads }: { leads: Lead[] }) => {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Sem leads registadas</p>
        <p className="text-sm">Regista a tua primeira lead para começar a ganhar comissões.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium text-muted-foreground">Negócio</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Cidade</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Contacto</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Origem</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const contact = lead.contact_phone || lead.contact_email || lead.contact_website || "-";
            const cfg = statusConfig[lead.status] || statusConfig.new;
            return (
              <tr key={lead.id} className="border-t border-border">
                <td className="p-3 font-medium">{lead.business_name}</td>
                <td className="p-3 text-muted-foreground">{lead.city || "-"}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{contact}</td>
                <td className="p-3">
                  <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {lead.source === "referral_link" ? "🔗 Link" : "✏️ Manual"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString("pt-PT")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AffiliateLeadsTable;
