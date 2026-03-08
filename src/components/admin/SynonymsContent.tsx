import { useState, useMemo } from "react";
import { useSearchSynonyms, useCreateSearchSynonym, useDeleteSearchSynonym } from "@/hooks/useSearchSynonyms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search, FlaskConical, Zap } from "lucide-react";

const BULK_PRESETS = [
  { label: "Furo / Pneu → Oficina", items: [
    { termo: "furo", equivalente: "oficina", type: "word" },
    { termo: "furado", equivalente: "oficina", type: "word" },
    { termo: "pneu furado", equivalente: "oficina", type: "phrase" },
    { termo: "tive um furo", equivalente: "oficina", type: "phrase" },
  ]},
  { label: "Canalização", items: [
    { termo: "cano rebentou", equivalente: "canalizador", type: "phrase" },
    { termo: "fuga de agua", equivalente: "canalizador", type: "phrase" },
    { termo: "torneira partida", equivalente: "canalizador", type: "phrase" },
    { termo: "entupimento", equivalente: "canalizador", type: "word" },
  ]},
  { label: "Serralharia", items: [
    { termo: "fechadura partida", equivalente: "serralheiro", type: "phrase" },
    { termo: "chave partida", equivalente: "serralheiro", type: "phrase" },
    { termo: "porta trancada", equivalente: "serralheiro", type: "phrase" },
  ]},
  { label: "Eletricidade", items: [
    { termo: "curto circuito", equivalente: "eletricista", type: "phrase" },
    { termo: "sem luz", equivalente: "eletricista", type: "phrase" },
    { termo: "disjuntor", equivalente: "eletricista", type: "word" },
    { termo: "tomada partida", equivalente: "eletricista", type: "phrase" },
  ]},
];

// Simulate the same logic as the search engine
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const INTENT_PREFIXES = [
  "preciso de um","preciso de uma","preciso dum","preciso duma","queria um","queria uma",
  "tive um","tive uma","tenho um","tenho uma","aconteceu um","aconteceu uma",
  "o meu","a minha","estou com","estou sem","parti o","parti a",
  "rebentou o","rebentou a","avariou o","avariou a","estragou o","estragou a",
  "entupiu o","entupiu a","nao funciona o","nao funciona a",
  "deixou de funcionar o","deixou de funcionar a",
  "onde posso encontrar","onde encontro","como arranjo","procuro um","procuro uma",
  "procuro","busco","quero","preciso de","preciso","chamar um","chamar uma","chamar",
  "algum","alguma",
].map(normalize).sort((a, b) => b.length - a.length);

const STOP_WORDS = new Set(["de","do","da","dos","das","em","no","na","por","para","com","sem","um","uma","uns","umas","o","a","os","as","e","ou","que","se","ao","aos","isto","isso","meu","minha","meus","minhas"]);

function stripIntent(text: string): string {
  const norm = normalize(text);
  for (const prefix of INTENT_PREFIXES) {
    if (norm.startsWith(prefix + " ")) return norm.slice(prefix.length).trim();
    if (norm === prefix) return "";
  }
  return norm;
}

function extractKeywords(text: string): string[] {
  return normalize(text).split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

interface SimResult {
  matched: boolean;
  matchedSynonyms: { termo: string; equivalente: string; type: string }[];
  strippedQuery: string;
  keywords: string[];
}

function simulateSearch(
  rawQuery: string,
  synonyms: { termo: string; equivalente: string; type: string }[]
): SimResult {
  const query = normalize(rawQuery);
  const strippedQuery = stripIntent(rawQuery);
  const keywords = extractKeywords(strippedQuery || query);
  const keywordCombos: string[] = [];
  for (let len = keywords.length; len >= 1; len--) {
    keywordCombos.push(keywords.slice(0, len).join(" "));
  }
  const candidates = [query, strippedQuery, ...keywordCombos].filter(Boolean);

  const sorted = [...synonyms].sort((a, b) => b.termo.length - a.termo.length);
  const matchedSynonyms: { termo: string; equivalente: string; type: string }[] = [];

  // Phase 1: phrases
  const phrases = sorted.filter((s) => s.type === "phrase");
  for (const syn of phrases) {
    const normTermo = normalize(syn.termo);
    if (query.includes(normTermo) || normalize(strippedQuery).includes(normTermo)) {
      matchedSynonyms.push(syn);
    }
  }

  // Phase 2: words (only if no phrase matched)
  if (matchedSynonyms.length === 0) {
    const words = sorted.filter((s) => s.type !== "phrase");
    for (const candidate of candidates) {
      if (!candidate || candidate.length < 2) continue;
      const normCandidate = normalize(candidate);
      for (const syn of words) {
        const normTermo = normalize(syn.termo);
        if (normTermo === normCandidate || normCandidate.includes(normTermo)) {
          if (!matchedSynonyms.find((m) => m.termo === syn.termo && m.equivalente === syn.equivalente)) {
            matchedSynonyms.push(syn);
          }
        }
      }
    }
  }

  return { matched: matchedSynonyms.length > 0, matchedSynonyms, strippedQuery, keywords };
}

const SynonymsContent = () => {
  const { toast } = useToast();
  const { data: synonyms = [], isLoading } = useSearchSynonyms();
  const createSynonym = useCreateSearchSynonym();
  const deleteSynonym = useDeleteSearchSynonym();
  const [termo, setTermo] = useState("");
  const [equivalente, setEquivalente] = useState("");
  const [type, setType] = useState<string>("word");
  const [filter, setFilter] = useState("");
  const [testQuery, setTestQuery] = useState("");

  const handleAdd = async () => {
    if (!termo.trim() || !equivalente.trim()) return;
    try {
      await createSynonym.mutateAsync({ termo: termo.trim(), equivalente: equivalente.trim(), type });
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

  const handleBulkAdd = async (items: { termo: string; equivalente: string; type: string }[]) => {
    const existingTermos = new Set(synonyms.map((s) => normalize(s.termo)));
    const newItems = items.filter((i) => !existingTermos.has(normalize(i.termo)));
    if (newItems.length === 0) {
      toast({ title: "Todos os sinónimos já existem" });
      return;
    }
    try {
      for (const item of newItems) {
        await createSynonym.mutateAsync(item);
      }
      toast({ title: `${newItems.length} sinónimos adicionados` });
    } catch {
      toast({ title: "Erro ao adicionar em massa", variant: "destructive" });
    }
  };

  const filtered = synonyms.filter(
    (s) =>
      !filter ||
      s.termo.toLowerCase().includes(filter.toLowerCase()) ||
      s.equivalente.toLowerCase().includes(filter.toLowerCase())
  );

  const testResult = useMemo(() => {
    if (!testQuery.trim() || testQuery.trim().length < 2) return null;
    const syns = synonyms.map((s) => ({ termo: s.termo, equivalente: s.equivalente, type: (s as any).type || "word" }));
    return simulateSearch(testQuery, syns);
  }, [testQuery, synonyms]);

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

      {/* Search Simulator */}
      <div className="bg-card rounded-xl p-6 shadow-card border-2 border-dashed border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Simulador de Pesquisa</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Teste como uma frase será processada pelo motor de pesquisa</p>
        <Input
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          placeholder='ex: "tive um furo", "cano rebentou", "preciso de eletricista"'
          className="mb-3"
        />
        {testResult && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground">Query limpa:</span>
              <Badge variant="secondary">{testResult.strippedQuery || "(vazio)"}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground">Keywords:</span>
              {testResult.keywords.map((k) => (
                <Badge key={k} variant="outline">{k}</Badge>
              ))}
              {testResult.keywords.length === 0 && <span className="text-muted-foreground italic">nenhuma</span>}
            </div>
            {testResult.matched ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">✅ Match encontrado!</p>
                {testResult.matchedSynonyms.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant={m.type === "phrase" ? "default" : "secondary"} className="text-xs">{m.type}</Badge>
                    <span className="font-medium">{m.termo}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary font-semibold">{m.equivalente}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-700 dark:text-amber-400">⚠️ Nenhum sinónimo corresponde</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione um sinónimo abaixo para cobrir esta pesquisa</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h2 className="font-semibold mb-3">Adicionar Sinónimo</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-32 space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Palavra</SelectItem>
                <SelectItem value="phrase">Frase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Termo</Label>
            <Input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder={type === "phrase" ? "ex: tive um furo" : "ex: electricista"} />
          </div>
          <div className="flex items-end text-muted-foreground font-bold pb-2">=</div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Equivalente (categoria/subcategoria)</Label>
            <Input value={equivalente} onChange={(e) => setEquivalente(e.target.value)} placeholder="ex: oficina" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={createSynonym.isPending || !termo.trim() || !equivalente.trim()}>
              {createSynonym.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk presets */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold">Adicionar em Massa</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Pacotes pré-definidos de sinónimos comuns</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BULK_PRESETS.map((preset) => (
            <div key={preset.label} className="border border-border rounded-lg p-4">
              <p className="font-medium text-sm mb-2">{preset.label}</p>
              <div className="space-y-1 mb-3">
                {preset.items.map((item) => (
                  <div key={item.termo} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Badge variant={item.type === "phrase" ? "default" : "secondary"} className="text-[10px] px-1 py-0">{item.type === "phrase" ? "F" : "P"}</Badge>
                    {item.termo} → {item.equivalente}
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleBulkAdd(preset.items)}>
                Adicionar {preset.items.length} sinónimos
              </Button>
            </div>
          ))}
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
              <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Termo</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Equivalente</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-4">
                  <Badge variant={(s as any).type === "phrase" ? "default" : "secondary"} className="text-xs">
                    {(s as any).type === "phrase" ? "Frase" : "Palavra"}
                  </Badge>
                </td>
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
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum sinónimo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground text-right">{filtered.length} sinónimos</p>
    </div>
  );
};

export default SynonymsContent;
