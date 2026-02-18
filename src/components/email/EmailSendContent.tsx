import { useState } from "react";
import { Send, Search } from "lucide-react";
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
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  // ✅ USAR O HOOK CORRETO
  const { data: businesses = [] } = useBusinessSearch(businessSearchQuery);

  const selectBusiness = (b: any) => {
    setSelectedBusiness(b);
    setBusinessSearchQuery(""); // Limpa search após selecionar
  };

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((t: any) => t.id === id);
    if (t && selectedBusiness) {
      setSubject(renderTemplate(t.subject, { 
        nome: selectedBusiness.name, 
        email: selectedBusiness.email, 
        cidade: selectedBusiness.city || "" 
      }));
      setHtml(renderTemplate(t.html_content, { 
        nome: selectedBusiness.name, 
        email: selectedBusiness.email, 
        cidade: selectedBusiness.city || "" 
      }));
    } else if (t) {
      setSubject(t.subject);
      setHtml(t.html_content);
    }
  };

  const handleSend = async () => {
    if (!selectedBusiness?.email || !subject || !html) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await sendEmail.mutateAsync({
        to: selectedBusiness.email,
        subject,
        html,
        templateId: templateId || undefined,
        metadata: { business_id: selectedBusiness.id, recipient_type: "business" },
      });
      toast({ title: "Email enviado com sucesso!" });
      // Limpar form
      setSelectedBusiness(null);
      setBusinessSearchQuery("");
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
        <p className="text-muted-foreground">Envio individual a um negócio</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Business Search */}
          <div className="space-y-2">
            <Label>Destinatário (Negócio) *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email ou responsável..."
                value={businessSearchQuery}
                onChange={(e) => setBusinessSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!!selectedBusiness}
              />
            </div>
            
            {/* Resultados da busca */}
            {businesses.length > 0 && !selectedBusiness && (
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
                        {b.ownerName && (
                          <p className="text-xs text-muted-foreground">Responsável: {b.ownerName}</p>
                        )}
                        {b.city && (
                          <p className="text-xs text-muted-foreground">📍 {b.city}</p>
                        )}
                      </div>
                      {/* Badge de status */}
                      <Badge variant={b.isActive ? "default" : "secondary"} className="text-xs">
                        {b.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedBusiness(null)}
                  >
                    Alterar
                  </Button>
                </div>
              </div>
            )}
            
            {/* Mensagem quando não há resultados */}
            {businessSearchQuery.length >= 2 && businesses.length === 0 && !selectedBusiness && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum negócio encontrado para "{businessSearchQuery}"
              </p>
            )}
          </div>

          {/* Template Selection */}
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

          {/* Subject */}
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Assunto do email" 
            />
          </div>

          {/* HTML Content */}
          <div className="space-y-2">
            <Label>Conteúdo HTML *</Label>
            <Textarea 
              rows={12} 
              value={html} 
              onChange={(e) => setHtml(e.target.value)} 
              className="font-mono text-xs" 
              placeholder="<p>Olá {{nome}},</p>..." 
            />
            <p className="text-xs text-muted-foreground">
              💡 Variáveis disponíveis: {'{{nome}}'}, {'{{email}}'}, {'{{cidade}}'}
            </p>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            disabled={sending || !selectedBusiness?.email || !subject || !html}
            className="w-full"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "A enviar..." : "Enviar Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSendContent;
