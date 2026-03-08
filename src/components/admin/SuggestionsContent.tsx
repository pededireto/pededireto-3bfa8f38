import { Trash2 } from "lucide-react";
import { Suggestion, useDeleteSuggestion, useUpdateSuggestionStatus } from "@/hooks/useSuggestions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SuggestionsContentProps {
  suggestions: Suggestion[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  nova: { label: "Nova", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
  em_análise: { label: "Em análise", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
  processada: { label: "Processada", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
};

const SuggestionsContent = ({ suggestions }: SuggestionsContentProps) => {
  const deleteSuggestion = useDeleteSuggestion();
  const updateStatus = useUpdateSuggestionStatus();
  const { toast } = useToast();

  const newCount = suggestions.filter(s => (s.status || "nova") === "nova").length;

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar esta sugestão?")) return;
    
    try {
      await deleteSuggestion.mutateAsync(id);
      toast({ title: "Sugestão eliminada" });
    } catch {
      toast({ title: "Erro ao eliminar", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: `Estado atualizado para "${STATUS_CONFIG[status]?.label || status}"` });
    } catch {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sugestões</h1>
          <p className="text-muted-foreground">Sugestões de cidades enviadas pelos utilizadores</p>
        </div>
        {newCount > 0 && (
          <Badge className="bg-blue-600 text-white">{newCount} nova{newCount > 1 ? "s" : ""}</Badge>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cidade</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion) => {
                const status = suggestion.status || "nova";
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.nova;
                return (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{suggestion.city_name}</TableCell>
                    <TableCell>{suggestion.email || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{suggestion.message || "—"}</TableCell>
                    <TableCell>
                      <Select value={status} onValueChange={(v) => handleStatusChange(suggestion.id, v)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <Badge variant="outline" className={config.className}>
                            {config.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(suggestion.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDelete(suggestion.id)}
                        disabled={deleteSuggestion.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {suggestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma sugestão recebida ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsContent;
