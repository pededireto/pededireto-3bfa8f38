import { useState } from "react";
import { useSearchLogsAggregated, useMarkSearchReviewed } from "@/hooks/useSearchLogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const SearchLogsContent = () => {
  const { data: logs = [], isLoading } = useSearchLogsAggregated();
  const markReviewed = useMarkSearchReviewed();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  const filtered = filter === "pending" ? logs.filter((l) => !l.is_reviewed) : logs;

  const handleMark = async (term: string) => {
    try {
      await markReviewed.mutateAsync(term);
      toast({ title: "Marcado como analisado" });
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pesquisas Sem Resultado</h1>
        <p className="text-muted-foreground">Termos pesquisados que não devolveram resultados</p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Por analisar
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Todos
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{filter === "pending" ? "Nenhuma pesquisa por analisar!" : "Sem registos de pesquisa."}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-semibold">Termo</th>
                <th className="p-4 font-semibold text-center">Frequência</th>
                <th className="p-4 font-semibold">Última pesquisa</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.search_term} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{log.search_term}</span>
                    </div>
                    {log.count >= 3 && (
                      <p className="text-xs text-accent mt-1">
                        💡 Considerar criar categoria ou subcategoria?
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant={log.count >= 5 ? "destructive" : log.count >= 3 ? "default" : "secondary"}>
                      {log.count}×
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(log.last_searched), "dd MMM yyyy, HH:mm", { locale: pt })}
                  </td>
                  <td className="p-4 text-center">
                    {log.is_reviewed ? (
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Analisado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {!log.is_reviewed && (
                      <Button size="sm" variant="outline" onClick={() => handleMark(log.search_term)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marcar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SearchLogsContent;
