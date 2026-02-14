import { useBusinessTeam } from "@/hooks/useBusinessMembership";
import { Users, Crown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamSectionProps {
  businessId: string;
}

const TeamSection = ({ businessId }: TeamSectionProps) => {
  const { data: team = [], isLoading } = useBusinessTeam(businessId);

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Proprietário";
      case "admin": return "Administrador";
      case "editor": return "Editor";
      default: return role;
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Equipa</h3>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : team.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem membros.</p>
      ) : (
        <div className="space-y-3">
          {team.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  {m.role === "owner" ? (
                    <Crown className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(m.profiles as any)?.full_name || "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(m.profiles as any)?.email || ""}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {roleLabel(m.role)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSection;
