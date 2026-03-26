import { useState } from "react";
import { Plus, FileText, Send, Download, Check, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  description: string;
  total: number;
  iva: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  createdAt: string;
}

// Mock quotes for initial UI
const MOCK_QUOTES: Quote[] = [];

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  sent: { label: "Aguarda resposta", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  accepted: { label: "Aceite", color: "bg-primary/10 text-primary" },
  rejected: { label: "Recusado", color: "bg-destructive/10 text-destructive" },
};

const BusinessQuotesContent = ({ businessId }: { businessId: string }) => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [ivaRate, setIvaRate] = useState("23");
  const [notes, setNotes] = useState("");
  const [validityDays, setValidityDays] = useState("30");

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const ivaAmount = subtotal * (parseInt(ivaRate) / 100);
  const total = subtotal + ivaAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleCreate = () => {
    if (!clientName.trim()) {
      toast({ title: "Preenche o nome do cliente", variant: "destructive" });
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast({ title: "Adiciona pelo menos um item", variant: "destructive" });
      return;
    }

    const newQuote: Quote = {
      id: Date.now().toString(),
      number: `#${String(quotes.length + 1).padStart(3, "0")}`,
      clientName,
      clientEmail,
      description: items[0]?.description || "",
      total,
      iva: ivaAmount,
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    setQuotes([newQuote, ...quotes]);
    setIsCreating(false);
    resetForm();
    toast({ title: "Orçamento criado com sucesso!" });
  };

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setNotes("");
  };

  const markAs = (id: string, status: Quote["status"]) => {
    setQuotes(quotes.map((q) => (q.id === id ? { ...q, status } : q)));
    toast({ title: `Orçamento marcado como ${statusLabels[status].label}` });
  };

  // Empty state
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
            Cria orçamentos PDF profissionais com o teu logo, NIF e dados de empresa. Envia diretamente por email ou partilha o link.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar primeiro orçamento
          </Button>
        </div>
      </div>
    );
  }

  // Creator modal
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Orçamento</h1>
            <p className="text-sm text-muted-foreground">Preenche os dados e cria o PDF</p>
          </div>
          <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
            Cancelar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
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
                  <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="joao@email.com" />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+351 900 000 000" />
                </div>
                <div>
                  <Label className="text-xs">Validade</Label>
                  <Select value={validityDays} onValueChange={setValidityDays}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(i)}>
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
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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

          {/* Preview */}
          <div className="bg-card rounded-xl p-6 shadow-card space-y-5 sticky top-4">
            <h3 className="font-semibold text-foreground">Preview</h3>

            <div className="border border-border rounded-lg p-5 space-y-4 text-sm">
              <div className="text-center border-b border-border pb-3">
                <p className="font-bold text-lg">ORÇAMENTO</p>
                <p className="text-muted-foreground text-xs">#{String(quotes.length + 1).padStart(3, "0")}</p>
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

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCreate}>
                <Check className="h-4 w-4 mr-1" /> Criar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">{quotes.length} orçamento{quotes.length !== 1 ? "s" : ""}</p>
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
                  <span className="text-sm text-foreground">· {quote.clientName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-foreground">{quote.total.toFixed(2)}€</span>
                  <span className="text-xs text-muted-foreground">
                    · {new Date(quote.createdAt).toLocaleDateString("pt-PT")}
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
                  <DropdownMenuItem onClick={() => markAs(quote.id, "sent")}>
                    <Send className="h-4 w-4 mr-2" /> Marcar como enviado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => markAs(quote.id, "accepted")}>
                    <Check className="h-4 w-4 mr-2" /> Marcar como aceite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => markAs(quote.id, "rejected")}>
                    <Clock className="h-4 w-4 mr-2" /> Marcar como recusado
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessQuotesContent;
