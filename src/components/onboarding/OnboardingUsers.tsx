import { useState } from "react";
import { useOnboardingUsers } from "@/hooks/useOnboardingData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

const OnboardingUsers = () => {
  const { data: users = [], isPending } = useOnboardingUsers();
  const [search, setSearch] = useState("");

  const filtered = users.filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  if (isPending) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">👥 Utilizadores</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Nome</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Email</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Tipo</th>
              <th className="text-left p-3 font-medium text-muted-foreground text-sm">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((user: any) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-3 font-medium text-sm">{user.full_name || "—"}</td>
                <td className="p-3 text-muted-foreground text-sm">{user.email || "—"}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">
                    {user.role || "user"}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-PT") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Nenhum utilizador encontrado.</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">A mostrar {Math.min(filtered.length, 200)} de {filtered.length} utilizadores</p>
    </div>
  );
};

export default OnboardingUsers;
