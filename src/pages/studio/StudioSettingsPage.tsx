import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const StudioSettingsPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display font-bold text-lg">Definições</h1>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Conta</h2>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <p className="text-sm">{user?.user_metadata?.full_name || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Plano</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-cta/10 text-cta px-2 py-1 rounded-md font-medium">
            ⚡ Trial 30 dias
          </span>
          <span className="text-xs text-muted-foreground">Marketing AI Studio</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline">Voltar ao Pede Direto</Button>
        </Link>
        <Button variant="destructive" onClick={signOut}>
          Terminar sessão
        </Button>
      </div>
    </div>
  );
};

export default StudioSettingsPage;
