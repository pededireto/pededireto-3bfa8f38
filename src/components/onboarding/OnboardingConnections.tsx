import { useOnboardingConnections } from "@/hooks/useOnboardingData";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  pending_owner: "Pending Owner",
  member: "Member",
  revoked: "Revoked",
};

const OnboardingConnections = () => {
  const { data: connections = [], isPending } = useOnboardingConnections();

  if (isPending) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🔗 Ligações User ↔ Business</h2>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Utilizador</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Negócio</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Tipo</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Data</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-medium text-sm">{c.user_name || "—"}</td>
                <td className="p-3 text-muted-foreground text-sm">{c.user_email || "—"}</td>
                <td className="p-3 text-sm">{c.business_name || "—"}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">
                    {ROLE_LABELS[c.role] || c.role}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString("pt-PT") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {connections.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhuma ligação encontrada.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{connections.length} ligações</p>
    </div>
  );
};

export default OnboardingConnections;
