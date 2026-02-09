import { useState } from "react";
import { useSearchSynonyms, useCreateSearchSynonym, useDeleteSearchSynonym } from "@/hooks/useSearchSynonyms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

const SynonymsContent = () => {
  const { toast } = useToast();
  const { data: synonyms = [], isLoading } = useSearchSynonyms();
  const createSynonym = useCreateSearchSynonym();
  const deleteSynonym = useDeleteSearchSynonym();
  const [termo, setTermo] = useState("");
  const [equivalente, setEquivalente] = useState("");
  const [filter, setFilter] = useState("");

  const handleAdd = async () => {
    if (!termo.trim() || !equivalente.trim()) return;
    try {
      await createSynonym.mutateAsync({ termo: termo.trim(), equivalente: equivalente.trim() });
      toast({ title: "Sinónimo adicionado" });
      setTermo("");
      setEquivalente("");
    } catch {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSynonym.mutateAsync(id);
      toast({ title: "Sinónimo removido" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const filtered = synonyms.filter(
    (s) =>
      !filter ||
      s.termo.toLowerCase().includes(filter.toLowerCase()) ||
      s.equivalente.toLowerCase().includes(filter.toLowerCase())
  );

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sinónimos de Pesquisa</h1>
        <p className="text-muted-foreground">Gerir equivalências para pesquisa inteligente</p>
      </div>

      {/* Add form */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-semibold mb-3">Adicionar Sinónimo</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Termo</Label>
            <Input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="ex: electricista" />
          </div>
          <div className="flex items-end text-muted-foreground font-bold pb-2">=</div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Equivalente</Label>
            <Input value={equivalente} onChange={(e) => setEquivalente(e.target.value)} placeholder="ex: eletricista" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={createSynonym.isPending || !termo.trim() || !equivalente.trim()}>
              {createSynonym.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar sinónimos..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Termo</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Equivalente</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-4 font-medium">{s.termo}</td>
                <td className="p-4 text-muted-foreground">{s.equivalente}</td>
                <td className="p-4 text-right">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhum sinónimo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground text-right">{filtered.length} sinónimos</p>
    </div>
  );
};

export default SynonymsContent;
