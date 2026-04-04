import { useState } from "react";
import { Plus, FileText, Send, Download, Check, Clock, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { useBusinessQuotes, useCreateQuote, useUpdateQuoteStatus, useDeleteQuote, Quote } from "@/hooks/useQuotes";

// ─────────────────────────────────────────────
// TIPOS LOCAIS
// ─────────────────────────────────────────────

interface BusinessInfo {
  name: string;
  logo_url: string | null;
  cta_website: string | null;
}

interface FormItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  sent: {
    label: "Aguarda resposta",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  accepted: { label: "Aceite", color: "bg-primary/10 text-primary" },
  rejected: { label: "Recusado", color: "bg-destructive/10 text-destructive" },
};

// ─────────────────────────────────────────────
// HOOK — dados do negócio
// ─────────────────────────────────────────────

const useBusinessInfo = (businessId: string) =>
  useQuery<BusinessInfo>({
    queryKey: ["business-info-pdf", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("name, logo_url, cta_website")
        .eq("id", businessId)
        .single();
      if (error) throw error;
      return data as BusinessInfo;
    },
    enabled: !!businessId,
  });

// ─────────────────────────────────────────────
// GERAÇÃO PDF — jsPDF puro (sem autotable)
// ─────────────────────────────────────────────

type RGB = [number, number, number];
const GREEN: RGB = [22, 163, 74];
const BLACK: RGB = [30, 30, 30];
const GREY: RGB = [120, 120, 120];
const LGREY: RGB = [220, 220, 220];
const WHITE: RGB = [255, 255, 255];
const ALTBG: RGB = [245, 245, 245];

const loadImageAsBase64 = (url: string): Promise<{ data: string; format: string } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({ data: canvas.toDataURL("image/png").split(",")[1], format: "PNG" });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const generateQuotePDF = async (quote: Quote, business: BusinessInfo): Promise<void> => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const L = 14;
  const R = PW - 14;

  const setRGB = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  // ── CABEÇALHO ──────────────────────────────
  setFill(GREEN);
  doc.rect(0, 0, PW, 38, "F");

  let logoLoaded = false;
  if (business.logo_url) {
    const logo = await loadImageAsBase64(business.logo_url);
    if (logo) {
      try {
        doc.addImage(logo.data, logo.format, L, 5, 28, 28);
        logoLoaded = true;
      } catch {
        /* ignora */
      }
    }
  }

  const textStartX = logoLoaded ? L + 32 : L;
  setRGB(WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(business.name, textStartX, 16);

  if (business.cta_website) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(business.cta_website.replace(/^https?:\/\//, ""), textStartX, 24);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ORÇAMENTO", R, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(quote.number, R, 20, { align: "right" });
  doc.text(new Date(quote.created_at).toLocaleDateString("pt-PT"), R, 27, { align: "right" });

  const validadeDate = new Date(
    new Date(quote.created_at).getTime() + quote.validity_days * 86_400_000,
  ).toLocaleDateString("pt-PT");
  doc.text(`Válido até: ${validadeDate}`, R, 34, { align: "right" });

  // ── CLIENTE ────────────────────────────────
  let y = 50;
  setRGB(BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CLIENTE", L, y);
  setDraw(LGREY);
  doc.line(L, y + 2, R, y + 2);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setRGB(BLACK);
  doc.text(quote.client_name, L, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setRGB(GREY);
  if (quote.client_email) {
    doc.text(quote.client_email, L, y);
    y += 5;
  }
  if (quote.client_phone) {
    doc.text(quote.client_phone, L, y);
    y += 5;
  }

  // ── TABELA ─────────────────────────────────
  y += 6;
  const COL = { descL: L, descR: 118, qtdR: 133, priceR: 160, totalR: R };
  const ROW_H = 8;

  setFill(GREEN);
  setDraw(GREEN);
  doc.rect(L, y, R - L, ROW_H, "F");
  setRGB(WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Descrição", COL.descL + 2, y + 5.5);
  doc.text("Qtd.", COL.qtdR, y + 5.5, { align: "right" });
  doc.text("Preço Unit.", COL.priceR, y + 5.5, { align: "right" });
  doc.text("Total", COL.totalR, y + 5.5, { align: "right" });
  y += ROW_H;

  const items = quote.items ?? [];
  items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      setFill(ALTBG);
      setDraw(ALTBG);
      doc.rect(L, y, R - L, ROW_H, "F");
    }
    setDraw(LGREY);
    doc.line(L, y + ROW_H, R, y + ROW_H);
    setRGB(BLACK);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const descTx = doc.splitTextToSize(item.description, COL.descR - COL.descL - 2)[0] ?? item.description;
    doc.text(descTx, COL.descL + 2, y + 5.5);
    doc.text(String(item.quantity), COL.qtdR, y + 5.5, { align: "right" });
    doc.text(`${Number(item.unit_price).toFixed(2)}€`, COL.priceR, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`${Number(item.total).toFixed(2)}€`, COL.totalR, y + 5.5, { align: "right" });
    y += ROW_H;
  });

  // ── TOTAIS ─────────────────────────────────
  y += 8;
  const TX = 130;
  setRGB(GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Subtotal:", TX, y);
  setRGB(BLACK);
  doc.text(`${Number(quote.subtotal).toFixed(2)}€`, R, y, { align: "right" });

  y += 6;
  setRGB(GREY);
  doc.text(`IVA (${quote.iva_rate}%):`, TX, y);
  setRGB(BLACK);
  doc.text(`${Number(quote.iva_amount).toFixed(2)}€`, R, y, { align: "right" });

  y += 4;
  setDraw(LGREY);
  doc.line(TX, y, R, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setRGB(BLACK);
  doc.text("Total:", TX, y);
  setRGB(GREEN);
  doc.text(`${Number(quote.total).toFixed(2)}€`, R, y, { align: "right" });

  // ── NOTAS ──────────────────────────────────
  if (quote.notes?.trim()) {
    y += 12;
    setDraw(LGREY);
    doc.line(L, y - 4, R, y - 4);
    setRGB(BLACK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("NOTAS / CONDIÇÕES", L, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setRGB(GREY);
    doc.text(doc.splitTextToSize(quote.notes, R - L), L, y);
  }

  // ── RODAPÉ ─────────────────────────────────
  setFill(GREEN);
  doc.rect(0, PH - 12, PW, 12, "F");
  setRGB(WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Orçamento gerado via PedeDireto · pededireto.pt", PW / 2, PH - 4.5, { align: "center" });

  const slug = quote.client_name.replace(/\s+/g, "-").toLowerCase();
  doc.save(`orcamento-${quote.number.replace("#", "")}-${slug}.pdf`);
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

const BusinessQuotesContent = ({ businessId }: { businessId: string }) => {
  const { toast } = useToast();

  // Dados
  const { data: quotes = [], isLoading } = useBusinessQuotes(businessId);
  const { data: businessInfo } = useBusinessInfo(businessId);
  const createQuote = useCreateQuote();
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Formulário
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<FormItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [ivaRate, setIvaRate] = useState("23");
  const [notes, setNotes] = useState("");
  const [validityDays, setValidityDays] = useState("30");

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const ivaAmount = subtotal * (parseInt(ivaRate) / 100);
  const total = subtotal + ivaAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof FormItem, value: string | number) =>
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setNotes("");
    setIvaRate("23");
    setValidityDays("30");
  };

  const handleCreate = async () => {
    if (!clientName.trim()) {
      toast({ title: "Preenche o nome do cliente", variant: "destructive" });
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast({ title: "Adiciona pelo menos um item", variant: "destructive" });
      return;
    }

    const filteredItems = items.filter((i) => i.description.trim());

    try {
      await createQuote.mutateAsync({
        business_id: businessId,
        client_name: clientName,
        client_email: clientEmail || undefined,
        client_phone: clientPhone || undefined,
        notes: notes || undefined,
        validity_days: parseInt(validityDays),
        iva_rate: parseInt(ivaRate),
        subtotal,
        iva_amount: ivaAmount,
        total,
        items: filteredItems.map((i, idx) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total: i.quantity * i.unitPrice,
          sort_order: idx,
        })),
      });

      setIsCreating(false);
      resetForm();
      toast({ title: "Orçamento criado e guardado!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao guardar orçamento", variant: "destructive" });
    }
  };

  const handleMarkAs = async (quote: Quote, status: Quote["status"]) => {
    try {
      await updateStatus.mutateAsync({ quoteId: quote.id, status, businessId });
      toast({ title: `Orçamento marcado como ${statusLabels[status].label}` });
    } catch {
      toast({ title: "Erro ao actualizar estado", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteQuote.mutateAsync({ quoteId: deleteTargetId, businessId });
      toast({ title: "Orçamento eliminado" });
    } catch {
      toast({ title: "Erro ao eliminar orçamento", variant: "destructive" });
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    if (!businessInfo) {
      toast({ title: "A carregar dados do negócio...", variant: "destructive" });
      return;
    }
    try {
      await generateQuotePDF(quote, businessInfo);
      toast({ title: "PDF gerado com sucesso!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  // ── Loading ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────
  if (quotes.length === 0 && !isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">Cria e envia orçamentos profissionais</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-muted-foreground/30 p-10 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Ainda não tens orçamentos</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Cria orçamentos PDF profissionais. Envia diretamente por email ou partilha o link.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar primeiro orçamento
          </Button>
        </div>
      </div>
    );
  }

  // ── Formulário ─────────────────────────────────
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Orçamento</h1>
            <p className="text-sm text-muted-foreground">Preenche os dados e cria o PDF</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FORM */}
          <div className="space-y-5">
            <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Dados do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nome *</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="João Silva" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+351 900 000 000"
                  />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Itens</h3>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    {i === 0 && <Label className="text-xs">Descrição</Label>}
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Serviço ou produto..."
                    />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <Label className="text-xs">Qtd.</Label>}
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <Label className="text-xs">Preço (€)</Label>}
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeItem(i)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar item
              </Button>
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Taxa de IVA</Label>
                <Select value={ivaRate} onValueChange={setIvaRate}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Isento</SelectItem>
                    <SelectItem value="6">6%</SelectItem>
                    <SelectItem value="13">13%</SelectItem>
                    <SelectItem value="23">23%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notas / Condições</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condições de pagamento, prazo de entrega..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="bg-card rounded-xl p-6 shadow-card space-y-5 sticky top-4">
            <h3 className="font-semibold text-foreground">Preview</h3>
            <div className="border border-border rounded-lg p-5 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  {businessInfo?.logo_url && (
                    <img
                      src={businessInfo.logo_url}
                      alt="Logo"
                      className="h-10 w-10 object-contain rounded"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div>
                    <p className="font-bold text-sm">{businessInfo?.name || "—"}</p>
                    {businessInfo?.cta_website && (
                      <p className="text-[10px] text-muted-foreground">
                        {businessInfo.cta_website.replace(/^https?:\/\//, "")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">ORÇAMENTO</p>
                  <p className="text-muted-foreground text-xs">#{String(quotes.length + 1).padStart(3, "0")}</p>
                </div>
              </div>

              {clientName && (
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">{clientName}</p>
                  {clientEmail && <p className="text-xs text-muted-foreground">{clientEmail}</p>}
                </div>
              )}
              {items.some((i) => i.description) && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <div className="col-span-6">Descrição</div>
                    <div className="col-span-2 text-center">Qtd</div>
                    <div className="col-span-2 text-right">Preço</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {items
                    .filter((i) => i.description)
                    .map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border text-xs">
                        <div className="col-span-6">{item.description}</div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-right">{item.unitPrice.toFixed(2)}€</div>
                        <div className="col-span-2 text-right font-medium">
                          {(item.quantity * item.unitPrice).toFixed(2)}€
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>IVA ({ivaRate}%)</span>
                  <span>{ivaAmount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{total.toFixed(2)}€</span>
                </div>
              </div>
              {notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Notas:</p>
                  <p className="text-xs">{notes}</p>
                </div>
              )}
              <div className="text-center pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">Orçamento gerado via PedeDireto</p>
                <p className="text-[10px] text-muted-foreground">
                  Válido até {new Date(Date.now() + parseInt(validityDays) * 86400000).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={createQuote.isPending}>
              {createQuote.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A guardar...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" /> Criar Orçamento
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Listagem ────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
            <p className="text-sm text-muted-foreground">
              {quotes.length} orçamento{quotes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Orçamento
          </Button>
        </div>

        <div className="space-y-3">
          {quotes.map((quote) => {
            const st = statusLabels[quote.status];
            return (
              <div key={quote.id} className="bg-card rounded-xl p-5 shadow-card flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{quote.number}</span>
                    <span className="text-sm text-foreground">· {quote.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-foreground">{Number(quote.total).toFixed(2)}€</span>
                    <span className="text-xs text-muted-foreground">
                      · {new Date(quote.created_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
                <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMarkAs(quote, "sent")}>
                      <Send className="h-4 w-4 mr-2" /> Marcar como enviado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMarkAs(quote, "accepted")}>
                      <Check className="h-4 w-4 mr-2" /> Marcar como aceite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMarkAs(quote, "rejected")}>
                      <Clock className="h-4 w-4 mr-2" /> Marcar como recusado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTargetId(quote.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmação de eliminação */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção é irreversível. O orçamento e todos os seus itens serão eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BusinessQuotesContent;
