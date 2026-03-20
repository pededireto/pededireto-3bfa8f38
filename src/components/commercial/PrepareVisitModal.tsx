import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";
import type { CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";

interface Props {
  open: boolean;
  onClose: () => void;
  business: any;
  benchmark: CommercialBenchmarkData;
  subcategory: string;
  category: string;
  onOpenFullSheet: () => void;
}

const truncate = (text: string | undefined, maxLines: number = 2): string => {
  if (!text) return "—";
  const words = text.split(" ");
  // Rough: ~15 words per line
  const max = maxLines * 15;
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
};

const PrepareVisitModal = ({ open, onClose, business, benchmark, subcategory, category, onOpenFullSheet }: Props) => {
  const [copied, setCopied] = useState(false);

  // Build opening phrase from tendencia_2025
  const openingPhrase = (() => {
    if (!benchmark.tendencia_2025) return null;
    const sentences = benchmark.tendencia_2025.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const opening = sentences.slice(0, 2).join(". ").trim();
    return opening ? (opening.endsWith(".") ? opening : `${opening}.`) : null;
  })();

  // Price objection phrase
  const pricePhrase = benchmark.ticket_medio
    ? `Um cliente novo neste sector vale em média ${benchmark.ticket_medio}. A mensalidade da Pede Direto custa menos do que 10% de uma única venda. O retorno é imediato.`
    : null;

  // Urgency phrase
  const urgencyPhrase = (() => {
    if (!benchmark.tendencia_2025) return null;
    const sentences = benchmark.tendencia_2025.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const trend = sentences.length > 0 ? sentences[sentences.length - 1].trim() : benchmark.tendencia_2025.slice(0, 80);
    return `O mercado de ${subcategory} está a mudar — ${trend}. Quem aparecer agora na Pede Direto tem vantagem sobre quem aparecer daqui a 6 meses.`;
  })();

  // Build shareable text summary
  const buildShareText = () => {
    const lines: string[] = [
      `VISITA A: ${business.name}`,
      `${category} → ${subcategory}`,
      business.city ? `📍 ${business.city}` : "",
      "",
      "O QUE SABER EM 60 SEGUNDOS:",
      "",
    ];
    if (benchmark.ticket_medio) lines.push(`1️⃣ ELES GANHAM: ${truncate(benchmark.ticket_medio)}`);
    if (benchmark.canal_aquisicao_principal) lines.push(`2️⃣ OS CLIENTES CHEGAM POR: ${truncate(benchmark.canal_aquisicao_principal)}`);
    if (benchmark.tendencia_2025) {
      const first = benchmark.tendencia_2025.split(/[.!?]/)[0]?.trim();
      lines.push(`3️⃣ O MERCADO ESTÁ A MUDAR: ${first || "—"}`);
    }
    if (benchmark.diferencial_competitivo) lines.push(`4️⃣ OS MELHORES FAZEM: ${truncate(benchmark.diferencial_competitivo)}`);
    lines.push("");
    lines.push("FRASES PRONTAS:");
    if (openingPhrase) lines.push(`🗣️ ABERTURA: "${openingPhrase}"`);
    if (pricePhrase) lines.push(`💰 SE DISSEREM QUE É CARO: "${pricePhrase}"`);
    if (urgencyPhrase) lines.push(`⚡ FECHO: "${urgencyPhrase}"`);
    return lines.filter(l => l !== undefined).join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[95vh] overflow-y-auto p-0 gap-0 bg-foreground text-background border-0 [&>button]:hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-white/50">Modo Preparação</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-bold">VISITA A: {business.name}</h2>
          <p className="text-sm text-white/60">{category} → {subcategory}</p>
          {business.city && <p className="text-sm text-white/60">📍 {business.city}</p>}
        </div>

        {/* Key Info */}
        <div className="p-5 space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white/50">O que saber em 60 segundos</h3>

          {benchmark.ticket_medio && (
            <div>
              <p className="text-xs font-semibold text-amber-400">1️⃣ ELES GANHAM:</p>
              <p className="text-sm mt-0.5">{truncate(benchmark.ticket_medio)}</p>
            </div>
          )}

          {benchmark.canal_aquisicao_principal && (
            <div>
              <p className="text-xs font-semibold text-blue-400">2️⃣ OS CLIENTES CHEGAM POR:</p>
              <p className="text-sm mt-0.5">{truncate(benchmark.canal_aquisicao_principal)}</p>
            </div>
          )}

          {benchmark.tendencia_2025 && (
            <div>
              <p className="text-xs font-semibold text-purple-400">3️⃣ O MERCADO ESTÁ A MUDAR:</p>
              <p className="text-sm mt-0.5">{benchmark.tendencia_2025.split(/[.!?]/)[0]?.trim() || "—"}</p>
            </div>
          )}

          {benchmark.diferencial_competitivo && (
            <div>
              <p className="text-xs font-semibold text-emerald-400">4️⃣ OS MELHORES FAZEM:</p>
              <p className="text-sm mt-0.5">{truncate(benchmark.diferencial_competitivo)}</p>
            </div>
          )}
        </div>

        {/* Ready phrases */}
        {(openingPhrase || pricePhrase || urgencyPhrase) && (
          <div className="p-5 border-t border-white/10 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-white/50">Frases Prontas</h3>

            {openingPhrase && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-white/70">🗣️ ABERTURA:</p>
                <p className="text-sm mt-1 italic">"{openingPhrase}"</p>
              </div>
            )}

            {pricePhrase && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-white/70">💰 SE DISSEREM QUE É CARO:</p>
                <p className="text-sm mt-1 italic">"{pricePhrase}"</p>
              </div>
            )}

            {urgencyPhrase && (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs font-semibold text-white/70">⚡ FECHO:</p>
                <p className="text-sm mt-1 italic">"{urgencyPhrase}"</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-5 border-t border-white/10 space-y-2">
          <Button
            className="w-full bg-success hover:bg-success/90 text-white"
            onClick={onOpenFullSheet}
          >
            Entrar na Ficha Completa
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={handleShare}
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado!" : "Partilhar"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrepareVisitModal;
