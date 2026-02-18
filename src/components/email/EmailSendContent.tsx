import { useState, useEffect } from "react";
import { Send, Search, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEmailTemplates, useSendEmail, renderTemplate, useBusinessSearch } from "@/hooks/useEmailMarketing";
import { useToast } from "@/hooks/use-toast";

const EmailSendContent = () => {
  const { toast } = useToast();
  const { data: templates = [] } = useEmailTemplates();
  const sendEmail = useSendEmail();

  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [useManualEmail, setUseManualEmail] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  const { data: businesses = [] } = useBusinessSearch(businessSearchQuery);

  // Destinatário final — negócio ou email manual
  const recipientEmail = selectedBusiness?.email || (useManualEmail ? manualEmail : "");

  // Re-renderiza template quando negócio ou templateId muda
  useEffect(() => {
    if (!templateId) return;
    const t = templates.find((t: any) => t.id === templateId);
    if (!t) return;

    if (selectedBusiness) {
      const vars = {
        nome: selectedBusiness.name || "",
        email: selectedBusiness.email || "",
        cidade: selectedBusiness.city || "",
        link_dashboard: "https://pededireto.pt",
      };
      setSubject(renderTemplate(t.subject, vars));
      setHtml(renderTemplate(t.html_content, vars));
    } else {
      setSubject(t.subject);
      setHtml(t.html_content);
    }
  }, [selectedBusiness, templateId, templates]);

  const selectBusiness = (b: any) => {
    setSelectedBusiness(b);
    setBusinessSearchQuery("");
    setUseManualEmail(false);
    setManualEmail("");
  };

  const selectTemplate = (id: string) => {
    if (id === "none") {
      setTemplateId("");
      setSubject("");
      setHtml("");
    } else {
      setTemplateId(id);
    }
  };

  const handleReset = () => {
    setSelectedBusiness(null);
    setBusinessSearchQuery("");
    setUseManualEmail(false);
    setManualEmail("");
  };

  const handleSend = async () => {
    if (!recipientEmail || !subject || !html) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({ title: "Email inválido", description: "Verifique o endereço de email.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await sendEmail.mutateAsync({
        to: recipientEmail,
        subject,
        html,
        templateId: templateId || undefined,
        metadata: {
          business_id: selectedBusiness?.id || null,
          recipient_type: selectedBusiness ? "business" : "manual",
        },
      });
      toast({ title: "Email enviado com sucesso!" });
      setSelectedBusiness(null);
      setBusinessSearchQuery("");
      setUseManualEmail(false);
      setManualEmail("");
      setSubject("");
      setHtml("");
      setTemplateId("");
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Enviar Email</h2>
        <p className="text-muted-foreground">Envio individual a um negócio ou email avulso</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">

          {/* ===== DESTINATÁRIO ===== */}
          <div className="space-y-2">
            <Label>Destinatário *</Label>

            {/* Negócio selecionado */}
            {selectedBusiness && (
              <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{selectedBusiness.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">✉️ {selectedBusiness.email}</p>
                    {selectedBusiness.ownerName && (
                      <p className="text-xs text-muted-foreground">👤 {selectedBusiness.ownerName}</p>
                    )}
                    {selectedBusiness.city && (
                      <p className="text-xs text-muted-foreground">📍 {selectedBusiness.city}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>Alterar</Button>
                </div>
              </div>
            )}

            {/* Email manual ativo */}
            {useManualEmail && !selectedBusiness && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button variant="outline" size="sm" onClick={handleReset}>Cancelar</Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserX className="w-3 h-3" />
                  Email avulso — sem negócio associado na base de dados.
                </p>
              </div>
            )}

            {/* Pesquisa de negócio */}
            {!selectedBusiness && !useManualEmail && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar negócio por nome, email ou responsável..."
                    value={businessSearchQuery}
                    onChange={(e) => setBusinessSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Resultados */}
                {businesses.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {businesses.map((b: any) => (
                      <button
                        key={b.id}
                        className="w-full text-left p-3 hover:bg-muted transition-colors"
                        onClick={() => selectBusiness(b)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.email}</p>
                            {b.ownerName && <p className="text-xs text-muted-foreground">Responsável: {b.ownerName}</p>}
                            {b.city && <p className="text-xs text-muted-foreground">📍 {b.city}</p>}
                          </div>
                          <Badge variant={b.isActive ? "default" : "secondary"} className="text-xs">
                            {b.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sem resultados → opção de email manual */}
                {businessSearchQuery.length >= 2 && businesses.length === 0 && (
                  <div className="border rounded-lg p-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Nenhum negócio encontrado para "<strong>{businessSearchQuery}</strong>"
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseManualEmail(true);
                        // Se parece um email, pré-preenche automaticamente
                        if (businessSearchQuery.includes("@")) {
                          setManualEmail(businessSearchQuery);
                        }
                        setBusinessSearchQuery("");
                      }}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Enviar para este email sem negócio associado
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== TEMPLATE ===== */}
          <div className="space-y-2">
            <Label>Template (opcional)</Label>
            <Select value={templateId} onValueChange={selectTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Sem template / escrever manualmente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem template</SelectItem>
                {templates.filter((t: any) => t.is_active).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ===== ASSUNTO ===== */}
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
            />
          </div>

          {/* ===== HTML ===== */}
          <div className="space-y-2">
            <Label>Conteúdo HTML *</Label>
            <Textarea
              rows={12}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="font-mono text-xs"
              placeholder="<p>Olá,</p>..."
            />
            <p className="text-xs text-muted-foreground">
              💡 Variáveis disponíveis (só com negócio associado): {'{{nome}}'}, {'{{email}}'}, {'{{cidade}}'}, {'{{link_dashboard}}'}
            </p>
          </div>

          {/* ===== ENVIAR ===== */}
          <Button
            onClick={handleSend}
            disabled={sending || !recipientEmail || !subject || !html}
            className="w-full"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "A enviar..." : `Enviar Email${recipientEmail ? ` para ${recipientEmail}` : ""}`}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSendContent;
