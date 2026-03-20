import { useState } from "react";
import { Copy, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const PrepareVisitModal = ({ open, onClose, business, benchmark, subcategory, onOpenFullSheet }: Props) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!open) return null;

  // Gerar frases prontas
  const phrases: { label: string; text: string }[] = [];

  // Abertura
  if (benchmark.tendencia_2025) {
    const sentences = benchmark.tendencia_2025.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    const opening = sentences.slice(0, 2).join(". ").trim();
    if (opening) {
      phrases.push({
        label: "🗣️ ABERTURA",
        text: opening.endsWith(".") ? opening : `${opening}.`,
      });
    }
  }

  // Objecção de preço
  if (benchmark.ticket_medio) {
    phrases.push({
      label: "💰 SE DISSEREM QUE É CARO",
      text: `Um cliente novo neste sector vale em média ${benchmark.ticket_medio}. A mensalidade da Pede Direto custa menos do que 10% de uma única venda. O retorno é imediato.`,
    });
  }

  // Fecho
  if (benchmark.tendencia_2025) {
    const sentences = benchmark.tendencia_2025.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    const trend = sentences.length > 0 ? sentences[sentences.length - 1].trim() : benchmark.tendencia_2025.slice(0, 80);
    phrases.push({
      label: "⚡ FECHO",
      text: `O mercado de ${subcategory} está a mudar — ${trend}. Quem aparecer agora na Pede Direto tem vantagem sobre quem aparecer daqui a 6 meses.`,
    });
  }

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const handleShare = () => {
    const lines = [`VISITA: ${business?.name || ""}`, `${subcategory}`, `${business?.city || ""}`, ``, `O QUE SABER:`];
    if (benchmark.ticket_medio) lines.push(`💰 Ticket médio: ${benchmark.ticket_medio}`);
    if (benchmark.canal_aquisicao_principal)
      lines.push(`🎯 Clientes chegam por: ${benchmark.canal_aquisicao_principal.slice(0, 80)}...`);
    if (benchmark.tendencia_2025) lines.push(`⚡ Tendência: ${benchmark.tendencia_2025.split(".")[0]}.`);
    if (benchmark.diferencial_competitivo)
      lines.push(`🏆 Melhores fazem: ${benchmark.diferencial_competitivo.slice(0, 80)}...`);
    lines.push(``, `FRASES:`);
    phrases.forEach((p) => lines.push(`${p.label}: ${p.text}`));

    const shareText = lines.join("\n");
    try {
      navigator.clipboard.writeText(shareText);
    } catch {
      // fallback silencioso
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Preparação de Visita</p>
          <h2 className="font-bold text-lg leading-tight">{business?.name || "Negócio"}</h2>
          <p className="text-xs text-gray-400">
            {subcategory}
            {business?.city ? ` • ${business.city}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-4 space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">O QUE SABER EM 60 SEGUNDOS</p>

        {/* Blocos de informação */}
        <div className="space-y-3">
          {benchmark.ticket_medio && (
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">1️⃣</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ELES GANHAM</span>
              </div>
              <p className="text-sm text-white leading-relaxed">
                {benchmark.ticket_medio.split(";").slice(0, 2).join(";").trim()}
              </p>
            </div>
          )}

          {benchmark.canal_aquisicao_principal && (
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">2️⃣</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  OS CLIENTES CHEGAM POR
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed">
                {benchmark.canal_aquisicao_principal.split(";").slice(0, 2).join(";").trim()}
              </p>
            </div>
          )}

          {benchmark.tendencia_2025 && (
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">3️⃣</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  O MERCADO ESTÁ A MUDAR
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed">{benchmark.tendencia_2025.split(".")[0].trim()}.</p>
            </div>
          )}

          {benchmark.diferencial_competitivo && (
            <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">4️⃣</span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">OS MELHORES FAZEM</span>
              </div>
              <p className="text-sm text-white leading-relaxed">
                {benchmark.diferencial_competitivo.split(".").slice(0, 2).join(".").trim()}.
              </p>
            </div>
          )}
        </div>

        {/* Frases prontas */}
        {phrases.length > 0 && (
          <div className="space-y-3">
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">FRASES PRONTAS</p>
              <div className="space-y-3">
                {phrases.map((phrase, idx) => (
                  <div key={idx} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                    <p className="text-xs font-semibold text-green-400 mb-2">{phrase.label}</p>
                    <p className="text-sm text-gray-200 leading-relaxed mb-3">"{phrase.text}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      onClick={() => handleCopy(phrase.text, idx)}
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer com botões */}
      <div className="sticky bottom-0 p-4 border-t border-gray-800 bg-gray-950 space-y-2">
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <Copy className="h-4 w-4 mr-2" /> Copiar resumo para WhatsApp
        </Button>
        <Button onClick={onOpenFullSheet} className="w-full bg-green-700 hover:bg-green-600 text-white">
          <ExternalLink className="h-4 w-4 mr-2" /> Entrar na Ficha Completa
        </Button>
      </div>
    </div>
  );
};

export default PrepareVisitModal;
