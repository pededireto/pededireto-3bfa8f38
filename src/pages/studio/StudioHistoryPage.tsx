import { useState } from "react";
import { Film, ImageIcon, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGenerations, useDeleteGeneration } from "@/hooks/useGenerations";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

const StudioHistoryPage = () => {
  const { data: generations, isPending } = useGenerations();
  const deleteGen = useDeleteGeneration();
  const [filter, setFilter] = useState<"all" | "reel" | "image">("all");
  const [viewingId, setViewingId] = useState<string | null>(null);

  const filtered = (generations || []).filter(
    (g: any) => filter === "all" || g.type === filter
  );

  const viewingGen = viewingId
    ? generations?.find((g: any) => g.id === viewingId)
    : null;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (viewingGen) {
    return (
      <div className="max-w-3xl space-y-4">
        <Button variant="ghost" onClick={() => setViewingId(null)}>
          ← Voltar ao histórico
        </Button>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{viewingGen.type === "reel" ? "🎬" : "🖼️"}</span>
            <div>
              <h2 className="font-display font-semibold">{viewingGen.title}</h2>
              <p className="text-xs text-muted-foreground">{viewingGen.subtitle}</p>
            </div>
          </div>
          <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-auto whitespace-pre-wrap max-h-[60vh]">
            {JSON.stringify(viewingGen.data, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-lg">Histórico de criações</h1>
        <div className="flex gap-1">
          {(["all", "reel", "image"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : f === "reel" ? "🎬 Reels" : "🖼️ Imagens"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-muted-foreground">
            Ainda sem criações — começa pelo Gerador de Reel
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((gen: any) => (
            <div
              key={gen.id}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{gen.type === "reel" ? "🎬" : "🖼️"}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true, locale: pt })}
                </span>
              </div>
              <h3 className="text-sm font-semibold truncate">{gen.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{gen.subtitle}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setViewingId(gen.id)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteGen.mutate(gen.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudioHistoryPage;
