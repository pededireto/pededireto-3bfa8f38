import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VALID_IDS = new Set([
  "prod_U305By4GfT8ybd",
  "prod_U305DODAQLfQQz",
  "prod_U305Sz8v2PesNR",
  "prod_U3057VqNMqtETn",
  "prod_U305nyWocSku2v",
  "prod_U30574zeFvKFdu",
  "prod_U305vIQfUgdKYC",
  "prod_U305JApxNseZ4o",
  "prod_U3059puWonzcag",
]);

interface StripeProduct {
  id: string;
  name: string;
  created: number;
  active: boolean;
}

const StripeCleanup = () => {
  const { user, isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [archiveResults, setArchiveResults] = useState<{ id: string; success: boolean; error?: string }[] | null>(null);

  useEffect(() => {
    if (user && (isAdmin || isSuperAdmin)) fetchProducts();
  }, [user, isAdmin, isSuperAdmin]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-cleanup", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const prods: StripeProduct[] = data.products || [];
      setProducts(prods);

      // Pre-select duplicates (not in valid list)
      const duplicates = new Set(
        prods.filter((p) => !VALID_IDS.has(p.id) && p.active).map((p) => p.id)
      );
      setSelected(duplicates);
    } catch (err: any) {
      toast({ title: "Erro ao carregar produtos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(products.filter((p) => p.active).map((p) => p.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleArchive = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setArchiving(true);
    setProgress(0);
    setArchiveResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("stripe-cleanup", {
        body: { action: "archive", product_ids: ids },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setArchiveResults(data.results);
      setProgress(100);

      const failed = (data.results || []).filter((r: any) => !r.success);
      if (failed.length > 0) {
        toast({ title: `${failed.length} falharam`, variant: "destructive" });
      } else {
        toast({ title: `${ids.length} produtos arquivados com sucesso!` });
      }

      // Refresh
      await fetchProducts();
    } catch (err: any) {
      toast({ title: "Erro ao arquivar", description: err.message, variant: "destructive" });
    } finally {
      setArchiving(false);
    }
  };

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

  const activeProducts = products.filter((p) => p.active);
  const inactiveProducts = products.filter((p) => !p.active);

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      {/* Warning */}
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 mb-6 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="font-semibold">⚠️ Página temporária — apagar após limpeza</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Limpeza de Produtos Stripe</h1>
      <p className="text-muted-foreground mb-6">
        Produtos marcados como duplicados (não na lista de IDs válidos) estão pré-seleccionados para arquivar.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          A carregar produtos do Stripe...
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
            <span>Total: <strong className="text-foreground">{products.length}</strong></span>
            <span>Activos: <strong className="text-foreground">{activeProducts.length}</strong></span>
            <span>Inativos: <strong className="text-muted-foreground">{inactiveProducts.length}</strong></span>
            <span>Seleccionados: <strong className="text-primary">{selected.size}</strong></span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <Button onClick={handleArchive} disabled={archiving || selected.size === 0} variant="destructive">
              {archiving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  A arquivar...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar Seleccionados ({selected.size})
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              Recarregar
            </Button>
          </div>

          {archiving && <Progress value={progress} className="mb-4" />}

          {/* Results */}
          {archiveResults && (
            <div className="mb-4 p-3 rounded-lg bg-muted text-sm">
              <strong>Resultado:</strong>{" "}
              {archiveResults.filter((r) => r.success).length} arquivados,{" "}
              {archiveResults.filter((r) => !r.success).length} falharam
              {archiveResults.filter((r) => !r.success).map((r) => (
                <div key={r.id} className="text-destructive mt-1">❌ {r.id}: {r.error}</div>
              ))}
            </div>
          )}

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size === activeProducts.length && activeProducts.length > 0}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const isValid = VALID_IDS.has(p.id);
                return (
                  <TableRow
                    key={p.id}
                    className={!p.active ? "opacity-50" : !isValid ? "bg-destructive/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                        disabled={!p.active}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.created * 1000).toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell>
                      {p.active ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm">Activo</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Arquivado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isValid ? (
                        <span className="text-sm text-primary font-medium">✅ Válido</span>
                      ) : (
                        <span className="text-sm text-destructive font-medium">🗑️ Duplicado</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {products.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
          )}
        </>
      )}
    </div>
  );
};

export default StripeCleanup;
