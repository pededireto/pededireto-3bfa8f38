import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  { name: "START Mensal SEPA", unit_amount: 990, interval: "month" as const, interval_count: 1 },
  { name: "START Mensal MBWay", unit_amount: 1490, interval: "month" as const, interval_count: 1 },
  { name: "START Anual SEPA", unit_amount: 10890, interval: "year" as const, interval_count: 1 },
  { name: "START Anual MBWay", unit_amount: 16390, interval: "year" as const, interval_count: 1 },
  { name: "PRO Mensal SEPA", unit_amount: 1990, interval: "month" as const, interval_count: 1 },
  { name: "PRO Mensal MBWay", unit_amount: 2490, interval: "month" as const, interval_count: 1 },
  { name: "PRO Anual SEPA", unit_amount: 10890, interval: "year" as const, interval_count: 1 },
  { name: "PRO Anual MBWay", unit_amount: 21890, interval: "year" as const, interval_count: 1 },
  { name: "PRO Pioneiro Anual SEPA", unit_amount: 9990, interval: "year" as const, interval_count: 1 },
];

interface PlanResult {
  name: string;
  stripe_product_id: string;
  stripe_price_id: string;
  error?: string;
}

const StripeSetup = () => {
  const { user, isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<PlanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isSuperAdmin)) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-stripe-plans", {
        body: { plans: PLANS },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResults(data.results);

      const failed = data.results.filter((r: PlanResult) => r.error);
      if (failed.length > 0) {
        toast({
          title: "Alguns planos falharam",
          description: `${failed.length} de ${PLANS.length} falharam.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Todos os planos criados com sucesso!" });
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const generateSQL = () => {
    return results
      .filter((r) => r.stripe_price_id && r.stripe_product_id)
      .map(
        (r) =>
          `UPDATE commercial_plans SET stripe_price_id = '${r.stripe_price_id}', stripe_product_id = '${r.stripe_product_id}' WHERE name = '${r.name}';`
      )
      .join("\n");
  };

  const handleCopySQL = async () => {
    const sql = generateSQL();
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    toast({ title: "SQL copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      {/* Warning banner */}
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 mb-6 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="font-semibold">⚠️ Página temporária — apagar após configuração do Stripe</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Configuração Stripe</h1>
      <p className="text-muted-foreground mb-6">
        Cria os {PLANS.length} produtos e preços no Stripe. Depois copia o SQL para atualizar a tabela <code>commercial_plans</code>.
      </p>

      {/* Plan list preview */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Planos a criar:</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          {PLANS.map((p) => (
            <li key={p.name}>
              {p.name} — €{(p.unit_amount / 100).toFixed(2)} / {p.interval === "month" ? "mês" : "ano"}
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={handleCreate} disabled={loading} size="lg" className="mb-6">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            A criar planos...
          </>
        ) : (
          "Criar Planos no Stripe"
        )}
      </Button>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 mb-6">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Resultados</h2>
            <Button variant="outline" size="sm" onClick={handleCopySQL}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado!" : "Copiar SQL"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Price ID</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.stripe_product_id || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.stripe_price_id || "—"}</TableCell>
                  <TableCell>
                    {r.error ? (
                      <span className="text-destructive text-sm">❌ {r.error}</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">✅ OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* SQL Preview */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">SQL Preview:</h3>
            <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap text-foreground">
              {generateSQL()}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default StripeSetup;
