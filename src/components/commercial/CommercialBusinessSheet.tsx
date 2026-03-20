import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUpsertPipeline, PIPELINE_PHASES } from "@/hooks/useCommercialPipeline";
import {
  useChecklist,
  useUpsertChecklist,
  DIAGNOSIS_QUESTIONS,
  OBJECTIONS,
  VISIT_RESULTS,
} from "@/hooks/useCommercialChecklist";
import { useContactLogs, useCreateContactLog } from "@/hooks/useContactLogs";
import { useProposals } from "@/hooks/useCommercialProposals";
import { useCommercialBenchmark, CommercialBenchmarkData } from "@/hooks/useCommercialBenchmark";
import {
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommercialStatus } from "@/hooks/useBusinesses";
import CommercialProposalForm from "./CommercialProposalForm";
import MarketExpertPanel from "./MarketExpertPanel";
import ConversationCards from "./ConversationCards";
import PrepareVisitModal from "./PrepareVisitModal";

interface Props {
  businessId: string | null;
  onClose: () => void;
}

// Helper: get contextual hint for a diagnosis question from benchmark data
const getDiagnosisHint = (question: string, benchmark: CommercialBenchmarkData | null | undefined): string | null => {
  if (!benchmark) return null;
  if (question.includes("De onde vêm") && benchmark.canal_aquisicao_principal) {
    const short = benchmark.canal_aquisicao_principal.split(" ").slice(0, 20).join(" ");
    return `Neste sector o canal principal é: ${short}`;
  }
  if (question.includes("plataforma online") && benchmark.presenca_digital) {
    const parts: string[] = [];
    if (benchmark.presenca_digital.website) parts.push(`website ${benchmark.presenca_digital.website}`);
    if (benchmark.presenca_digital.redes_sociais)
      parts.push(`redes sociais ${benchmark.presenca_digital.redes_sociais}`);
    if (parts.length > 0) return `Presença digital neste sector: ${parts.join(", ")}`;
  }
  return null;
};

// Helper: get enrichment text for an objection from benchmark data
const getObjectionEnrichment = (
  label: string,
  benchmark: CommercialBenchmarkData | null | undefined,
): string | null => {
  if (!benchmark) return null;
  if (label === "Já tenho clientes suficientes" && benchmark.tendencia_2025) {
    const firstSentence = benchmark.tendencia_2025.split(/[.!?]/)[0]?.trim();
    if (firstSentence) return `Dados do sector: ${firstSentence}.`;
  }
  if (label === "Já uso redes sociais e Google" && benchmark.presenca_digital?.redes_sociais) {
    return `Neste sector ${benchmark.presenca_digital.redes_sociais} dos negócios já têm redes sociais. A questão não é estar — é aparecer a quem tem intenção de compra.`;
  }
  if (label === "9,90€ é caro para mim agora" && benchmark.ticket_medio) {
    return `Ticket médio neste sector: ${benchmark.ticket_medio}. 1 cliente novo paga a mensalidade.`;
  }
  return null;
};

const CommercialBusinessSheet = ({ businessId, onClose }: Props) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dados");
  const [showPrepareModal, setShowPrepareModal] = useState(false);

  // Fetch business data
  const { data: business, isLoading: bizLoading } = useQuery({
    queryKey: ["commercial-business-detail", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("*, categories(name), subcategories(name)")
        .eq("id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!businessId,
  });

  // Pipeline data
  const { data: pipelineData } = useQuery({
    queryKey: ["pipeline-detail", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data } = await supabase
        .from("commercial_pipeline" as any)
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!businessId,
  });

  // Benchmark data — single query, cached, used by all sub-components
  const categoryName = business?.categories?.name || null;
  const subcategoryName = business?.subcategories?.name || null;
  const { data: benchmark } = useCommercialBenchmark(categoryName, subcategoryName);

  const upsertPipeline = useUpsertPipeline();
  const { data: checklist } = useChecklist(businessId || undefined);
  const upsertChecklist = useUpsertChecklist();
  const { data: contactLogs = [] } = useContactLogs(businessId || undefined);
  const createContactLog = useCreateContactLog();
  const { data: proposals = [] } = useProposals(businessId || undefined);

  // Local state for checklist
  const [questions, setQuestions] = useState<string[]>([]);
  const [objections, setObjections] = useState<string[]>([]);
  const [visitResult, setVisitResult] = useState("");
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [contactType, setContactType] = useState("telefone");
  const [contactNota, setContactNota] = useState("");
  const [showProposalForm, setShowProposalForm] = useState(false);

  useEffect(() => {
    if (checklist) {
      setQuestions((checklist.questions_checked as string[]) || []);
      setObjections((checklist.objections_checked as string[]) || []);
      setVisitResult(checklist.visit_result || "");
      setNotes(checklist.notes || "");
    } else {
      setQuestions([]);
      setObjections([]);
      setVisitResult("");
      setNotes("");
    }
  }, [checklist]);

  useEffect(() => {
    if (pipelineData) {
      setFollowupDate(pipelineData.next_followup_date || "");
      setFollowupNote(pipelineData.followup_note || "");
    }
  }, [pipelineData]);

  const handleSaveChecklist = async () => {
    if (!businessId) return;
    try {
      await upsertChecklist.mutateAsync({
        business_id: businessId,
        questions_checked: questions,
        objections_checked: objections,
        visit_result: visitResult || null,
        notes: notes || null,
      });
      toast({ title: "Checklist guardado" });
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  const handleSaveFollowup = async () => {
    if (!businessId) return;
    try {
      await upsertPipeline.mutateAsync({
        business_id: businessId,
        next_followup_date: followupDate || null,
        followup_note: followupNote || null,
      });
      toast({ title: "Follow-up atualizado" });
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    }
  };

  const handleAddContact = async () => {
    if (!businessId) return;
    try {
      await createContactLog.mutateAsync({
        business_id: businessId,
        tipo_contacto: contactType,
        nota: contactNota || undefined,
      });
      toast({ title: "Contacto registado" });
      setContactNota("");
    } catch {
      toast({ title: "Erro ao registar", variant: "destructive" });
    }
  };

  const toggleQuestion = (q: string) => {
    setQuestions((prev) => (prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]));
  };

  const toggleObjection = (o: string) => {
    setObjections((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  };

  const phaseConf = PIPELINE_PHASES.find((p) => p.value === (pipelineData?.phase || business?.commercial_status));

  return (
    <>
      <Sheet open={!!businessId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {bizLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : business ? (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <SheetTitle className="text-lg">{business.name}</SheetTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {business.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {business.city}
                        </span>
                      )}
                      {business.categories?.name && <span>• {business.categories.name}</span>}
                      {business.subcategories?.name && <span>• {business.subcategories.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {phaseConf && (
                    <Badge variant="secondary" className={cn("w-fit", phaseConf.color)}>
                      {phaseConf.emoji} {phaseConf.label}
                    </Badge>
                  )}
                  {benchmark && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowPrepareModal(true)}
                    >
                      <Smartphone className="h-3 w-3 mr-1" /> Preparar Visita
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="dados" className="text-xs">
                    Dados
                  </TabsTrigger>
                  <TabsTrigger value="script" className="text-xs">
                    Script
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="proposta" className="text-xs">
                    Proposta
                  </TabsTrigger>
                  <TabsTrigger value="followup" className="text-xs">
                    Follow-up
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Dados */}
                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Telefone</Label>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {business.cta_phone || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {business.cta_email || business.owner_email || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Website</Label>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {business.cta_website || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Subcategoria</Label>
                      <p className="text-sm font-medium">{business.subcategories?.name || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Plano</Label>
                      <p className="text-sm font-medium">
                        {business.subscription_status === "active" ? `${business.subscription_price}€/mês` : "Gratuito"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Registado em</Label>
                      <p className="text-sm font-medium">{new Date(business.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: Script de Vendas */}
                <TabsContent value="script" className="space-y-6 mt-4">
                  {/* Market Expert Panel — BEFORE script */}
                  {benchmark && subcategoryName && (
                    <div className="space-y-4">
                      <MarketExpertPanel data={benchmark} subcategory={subcategoryName} />
                      <ConversationCards data={benchmark} subcategory={subcategoryName} />
                    </div>
                  )}

                  {/* Diagnosis Questions with contextual hints */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Diagnóstico — Perguntas
                    </h3>
                    <div className="space-y-2">
                      {DIAGNOSIS_QUESTIONS.map((q) => {
                        const hint = getDiagnosisHint(q, benchmark);
                        return (
                          <div key={q}>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <Checkbox
                                checked={questions.includes(q)}
                                onCheckedChange={() => toggleQuestion(q)}
                                className="mt-0.5"
                              />
                              <span className="text-sm">{q}</span>
                            </label>
                            {hint && <p className="ml-6 mt-0.5 text-xs italic text-success">{hint}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Objections with benchmark enrichment */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Objecções Identificadas
                    </h3>
                    <div className="space-y-3">
                      {OBJECTIONS.map((obj) => {
                        const enrichment = getObjectionEnrichment(obj.label, benchmark);
                        return (
                          <div key={obj.label} className="space-y-1">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <Checkbox
                                checked={objections.includes(obj.label)}
                                onCheckedChange={() => toggleObjection(obj.label)}
                                className="mt-0.5"
                              />
                              <span className="text-sm font-medium">{obj.label}</span>
                            </label>
                            {objections.includes(obj.label) && (
                              <div className="ml-6 p-3 rounded-lg bg-success/5 border border-success/20">
                                <p className="text-xs text-success font-medium mb-1">💡 Contra-objecção:</p>
                                <p className="text-sm">{obj.response}</p>
                                {enrichment && (
                                  <p className="text-xs italic text-success mt-2 pt-2 border-t border-success/10">
                                    📊 {enrichment}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visit Result */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Resultado da Visita</Label>
                    <div className="space-y-2">
                      {VISIT_RESULTS.map((vr) => (
                        <label key={vr.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="visitResult"
                            value={vr.value}
                            checked={visitResult === vr.value}
                            onChange={(e) => setVisitResult(e.target.value)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{vr.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Notas</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações da visita..."
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleSaveChecklist} disabled={upsertChecklist.isPending} className="w-full">
                    {upsertChecklist.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Guardar Script
                  </Button>
                </TabsContent>

                {/* TAB: Histórico */}
                <TabsContent value="historico" className="space-y-4 mt-4">
                  {/* Add contact */}
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Registar Contacto</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={contactType} onValueChange={setContactType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="telefone">📞 Telefone</SelectItem>
                          <SelectItem value="email">📧 Email</SelectItem>
                          <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                          <SelectItem value="visita">🚶 Visita</SelectItem>
                          <SelectItem value="outro">📝 Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddContact} disabled={createContactLog.isPending} size="sm">
                        {createContactLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registar"}
                      </Button>
                    </div>
                    <Textarea
                      value={contactNota}
                      onChange={(e) => setContactNota(e.target.value)}
                      placeholder="Nota sobre o contacto..."
                      rows={2}
                    />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Timeline ({contactLogs.length})</h3>
                    {contactLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sem histórico.</p>
                    ) : (
                      contactLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {log.tipo_contacto}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleDateString("pt-PT", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {log.nota && <p className="text-sm">{log.nota}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* TAB: Proposta */}
                <TabsContent value="proposta" className="space-y-4 mt-4">
                  {showProposalForm ? (
                    <CommercialProposalForm
                      business={business}
                      onClose={() => setShowProposalForm(false)}
                      onSent={() => {
                        setShowProposalForm(false);
                        toast({ title: "Proposta enviada com sucesso!" });
                      }}
                    />
                  ) : (
                    <>
                      <Button onClick={() => setShowProposalForm(true)} className="w-full">
                        <FileText className="h-4 w-4 mr-2" /> Criar e Enviar Proposta
                      </Button>

                      {proposals.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">Propostas Anteriores ({proposals.length})</h3>
                          {proposals.map((p) => (
                            <div key={p.id} className="p-3 rounded-lg border border-border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">Plano {p.plan_recommended}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.price}€ • Válida até {new Date(p.valid_until).toLocaleDateString("pt-PT")}
                                  </p>
                                </div>
                                <Badge variant={p.sent_at ? "secondary" : "outline"} className="text-xs">
                                  {p.sent_at ? "Enviada" : "Rascunho"}
                                </Badge>
                              </div>
                              {p.email_to && <p className="text-xs text-muted-foreground mt-1">Para: {p.email_to}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* TAB: Follow-up */}
                <TabsContent value="followup" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Data do próximo follow-up</Label>
                      <Input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>O que ficou combinado</Label>
                      <Textarea
                        value={followupNote}
                        onChange={(e) => setFollowupNote(e.target.value)}
                        placeholder="Nota sobre o próximo passo..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleSaveFollowup} disabled={upsertPipeline.isPending} className="w-full">
                      {upsertPipeline.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Guardar Follow-up
                    </Button>
                  </div>

                  {/* Follow-up templates */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">📋 Templates de Follow-up</h3>
                    {FOLLOWUP_TEMPLATES.map((t) => (
                      <div key={t.day} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            Dia {t.day} — {t.channel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.message}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">Negócio não encontrado.</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Prepare Visit Modal */}
      {benchmark && business && subcategoryName && (
        <PrepareVisitModal
          open={showPrepareModal}
          onClose={() => setShowPrepareModal(false)}
          business={business}
          benchmark={benchmark}
          subcategory={subcategoryName}
          category={categoryName || ""}
          onOpenFullSheet={() => {
            setShowPrepareModal(false);
            setActiveTab("script");
          }}
        />
      )}
    </>
  );
};

const FOLLOWUP_TEMPLATES = [
  {
    day: 0,
    channel: "WhatsApp",
    message:
      "Olá [Nome]! Obrigado pelo tempo hoje. Como combinado, fica o link para o registo gratuito: pededireto.pt/register. Qualquer dúvida, estou disponível!",
  },
  {
    day: 2,
    channel: "WhatsApp",
    message:
      "Olá [Nome]! Queria partilhar um exemplo de como fica o perfil de um negócio na PedeDireto. Veja aqui: [link perfil exemplo]. O que acha?",
  },
  {
    day: 5,
    channel: "Email",
    message:
      "Olá [Nome], sabia que na sua zona há [X] pesquisas mensais por serviços como o seu? A PedeDireto pode direccionar esses clientes para o seu negócio.",
  },
  {
    day: 10,
    channel: "WhatsApp",
    message:
      "Olá [Nome]! Já teve oportunidade de pensar na proposta? Estou disponível para esclarecer qualquer dúvida. Posso ligar-lhe amanhã?",
  },
  {
    day: 20,
    channel: "WhatsApp/Email",
    message:
      "Olá [Nome]! Último contacto sobre a PedeDireto. Temos neste momento condições especiais PRO Pioneiro para os primeiros parceiros da sua zona. Interesse?",
  },
];

export default CommercialBusinessSheet;
