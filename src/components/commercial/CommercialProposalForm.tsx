import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProposal } from "@/hooks/useCommercialProposals";
import { useUpdatePipelinePhase } from "@/hooks/useCommercialPipeline";
import { useCreateContactLog } from "@/hooks/useContactLogs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  business: any;
  onClose: () => void;
  onSent: () => void;
}

const PLANS = [
  { value: "START", label: "START", price: 9.90 },
  { value: "PRO", label: "PRO", price: 19.90 },
  { value: "PRO_ANUAL", label: "PRO Anual", price: 199 },
];

const CommercialProposalForm = ({ business, onClose, onSent }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const createProposal = useCreateProposal();
  const updatePhase = useUpdatePipelinePhase();
  const createContactLog = useCreateContactLog();
  const [sending, setSending] = useState(false);

  const [plan, setPlan] = useState("START");
  const [price, setPrice] = useState("9.90");
  const [discount, setDiscount] = useState("0");
  const [validDays, setValidDays] = useState("7");
  const [personalMsg, setPersonalMsg] = useState("");
  const [emailTo, setEmailTo] = useState(business?.cta_email || business?.owner_email || "");
  const [commercialName, setCommercialName] = useState("");

  // Fetch profile name
  useQuery({
    queryKey: ["my-profile-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
      if (data?.full_name) setCommercialName(data.full_name);
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch benchmarking
  const { data: benchmark } = useQuery({
    queryKey: ["benchmarking-proposal", business?.categories?.name, business?.subcategories?.name],
    queryFn: async () => {
      const cat = business?.categories?.name;
      const sub = business?.subcategories?.name;
      if (!cat || !sub) return null;
      const { data } = await supabase
        .from("benchmarking_cache")
        .select("data")
        .eq("category", cat)
        .eq("subcategory", sub)
        .maybeSingle();
      return data?.data as any || null;
    },
    enabled: !!(business?.categories?.name && business?.subcategories?.name),
  });

  const planInfo = PLANS.find(p => p.value === plan);

  const validUntil = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Number(validDays));
    return d.toISOString().split("T")[0];
  }, [validDays]);

  const buildHtml = () => {
    const responsibleName = business?.owner_name || "Responsável";
    const bizName = business?.name || "";
    const subName = business?.subcategories?.name || business?.categories?.name || "";
    const finalPrice = Number(price);
    const discVal = Number(discount);
    const displayPrice = discVal > 0 ? (finalPrice * (1 - discVal / 100)).toFixed(2) : finalPrice.toFixed(2);

    let benchmarkSection = "";
    if (benchmark) {
      const items: string[] = [];
      if (benchmark.ticket_medio) items.push(`<li>💰 Ticket médio: ${benchmark.ticket_medio}</li>`);
      if (benchmark.canal_aquisicao_principal) items.push(`<li>🎯 Como chegam os clientes: ${benchmark.canal_aquisicao_principal}</li>`);
      if (benchmark.tendencia_2025) items.push(`<li>⚡ Tendência 2025: ${benchmark.tendencia_2025}</li>`);
      if (benchmark.diferencial_competitivo) items.push(`<li>🏆 O que os melhores fazem: ${benchmark.diferencial_competitivo}</li>`);
      if (benchmark.benchmark_avaliacoes) items.push(`<li>⭐ O que dizem os clientes: ${benchmark.benchmark_avaliacoes}</li>`);
      if (benchmark.dica_ouro) {
        // Only include the most relevant point, not the full text
        const firstPoint = benchmark.dica_ouro.split(/[.!?]/)[0]?.trim();
        if (firstPoint) items.push(`<li>💡 ${firstPoint}.</li>`);
      }
      if (items.length > 0) {
        benchmarkSection = `
          <div style="background:#f0f9f0;padding:20px;border-radius:12px;margin:20px 0;">
            <h3 style="color:#2E7D32;margin:0 0 10px;">📊 O que sabemos sobre o mercado de ${subName} em Portugal</h3>
            <ul style="margin:0;padding-left:20px;color:#333;">${items.join("")}</ul>
          </div>
        `;
      }
    }

    let features = "";
    if (plan === "START") {
      features = `<li>Perfil completo (logo, fotos, contactos, horário)</li>
        <li>WhatsApp visível</li><li>Sistema de avaliações</li>
        <li>Analytics básico</li><li>Chat com clientes</li>`;
    } else if (plan === "PRO") {
      features = `<li>Tudo do START</li><li>Analytics PRO e Intelligence Center</li>
        <li>Benchmarking do sector</li><li>Destaque na subcategoria</li>
        <li>Botões Reservar Agora e Pedir Online</li><li>Galeria de 6 fotos + vídeo</li>`;
    } else {
      features = `<li>Tudo do PRO</li><li>2 meses grátis vs mensal</li><li>Preço fixo garantido</li>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:#2E7D32;padding:30px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">PedeDireto</h1>
    <p style="color:#e8f5e9;margin:5px 0 0;font-size:14px;">Contacto directo, sem intermediários</p>
  </div>
  <div style="padding:30px;">
    <p style="color:#333;font-size:16px;">Olá <strong>${responsibleName}</strong>,</p>
    <p style="color:#555;">Na sequência do nosso contacto, segue a proposta para <strong>${bizName}</strong> aderir à PedeDireto.</p>
    ${benchmarkSection}
    <h3 style="color:#2E7D32;">✅ Vantagens de aderir à PedeDireto</h3>
    <ul style="color:#555;line-height:1.8;">
      <li>Contacto directo sem comissões</li>
      <li>Perfil verificado com avaliações reais</li>
      <li>Visibilidade para clientes com intenção de compra</li>
      <li>Sem contrato — cancela quando quiser</li>
      <li>Plataforma portuguesa a crescer agora</li>
    </ul>
    <h3 style="color:#2E7D32;">🚀 Funcionalidades do plano ${planInfo?.label}</h3>
    <ul style="color:#555;line-height:1.8;">${features}</ul>
    ${personalMsg ? `<div style="background:#fff3e0;padding:15px;border-radius:8px;margin:20px 0;border-left:4px solid #f57c00;"><p style="margin:0;color:#333;">${personalMsg}</p></div>` : ""}
    <div style="background:#e8f5e9;padding:25px;border-radius:12px;text-align:center;margin:25px 0;">
      <p style="font-size:18px;color:#333;margin:0 0 5px;">Recomendamos o plano <strong>${planInfo?.label}</strong></p>
      <p style="font-size:28px;color:#2E7D32;font-weight:bold;margin:5px 0;">${displayPrice}€${plan === "PRO_ANUAL" ? "/ano" : "/mês"}</p>
      ${discVal > 0 ? `<p style="font-size:14px;color:#f57c00;margin:5px 0;">🎁 Desconto especial de ${discount}%</p>` : ""}
      <p style="font-size:13px;color:#888;margin:10px 0 15px;">Proposta válida até ${new Date(validUntil).toLocaleDateString("pt-PT")}</p>
      <a href="https://pededireto.pt/register" style="display:inline-block;background:#2E7D32;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Aderir agora</a>
    </div>
    <p style="color:#555;font-size:14px;">Ou se preferir, responda a este email que tratamos de tudo por si.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:25px 0;">
    <p style="color:#333;font-size:14px;margin:0;">${commercialName || "Equipa Comercial"}</p>
    <p style="color:#888;font-size:13px;margin:3px 0;">PedeDireto | <a href="https://pededireto.pt" style="color:#2E7D32;">pededireto.pt</a></p>
    <p style="color:#888;font-size:13px;margin:3px 0;">geral@pededireto.pt</p>
  </div>
</div></body></html>`;
  };

  const handleSend = async () => {
    if (!emailTo) {
      toast({ title: "Email do destinatário é obrigatório", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const htmlContent = buildHtml();

      // Save proposal
      await createProposal.mutateAsync({
        business_id: business.id,
        plan_recommended: plan,
        price: Number(price),
        discount_percentage: Number(discount),
        valid_until: validUntil,
        personal_message: personalMsg || undefined,
        html_content: htmlContent,
        email_to: emailTo,
        sent_at: new Date().toISOString(),
      });

      // Send email via edge function
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: emailTo,
            subject: `Proposta PedeDireto para ${business.name}`,
            html: htmlContent,
            from_name: "PedeDireto Comercial",
            reply_to: "geral@pededireto.pt",
          },
        });
      } catch (emailErr) {
        console.warn("Email send failed, proposal saved anyway:", emailErr);
      }

      // Move to proposta_enviada phase
      try {
        await updatePhase.mutateAsync({ business_id: business.id, phase: "proposta_enviada" });
      } catch {}

      // Log contact
      try {
        await createContactLog.mutateAsync({
          business_id: business.id,
          tipo_contacto: "email",
          nota: `Proposta enviada — Plano ${planInfo?.label} ${Number(price).toFixed(2)}€`,
        });
      } catch {}

      onSent();
    } catch (err) {
      toast({ title: "Erro ao enviar proposta", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">📧 Nova Proposta Comercial</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Negócio</Label>
          <Input value={business?.name || ""} disabled className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email destinatário</Label>
          <Input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="email@..." className="text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Plano</Label>
          <Select value={plan} onValueChange={v => { setPlan(v); setPrice(String(PLANS.find(p => p.value === v)?.price || 0)); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLANS.map(p => <SelectItem key={p.value} value={p.value}>{p.label} — {p.price}€</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Preço (€)</Label>
          <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desconto (%)</Label>
          <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Validade (dias)</Label>
          <Input type="number" value={validDays} onChange={e => setValidDays(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Assinatura comercial</Label>
          <Input value={commercialName} onChange={e => setCommercialName(e.target.value)} className="text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Mensagem personalizada (opcional)</Label>
        <Textarea value={personalMsg} onChange={e => setPersonalMsg(e.target.value)} placeholder="Mensagem extra..." rows={2} />
      </div>

      {benchmark && (
        <p className="text-xs text-success flex items-center gap-1">✅ Dados de benchmarking disponíveis — serão incluídos na proposta</p>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSend} disabled={sending} className="flex-1">
          {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
          Enviar Proposta
        </Button>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
};

export default CommercialProposalForm;
