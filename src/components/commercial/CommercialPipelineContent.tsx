import { useState } from "react";
import { useMyPipeline, useAllPipeline, useUpdatePipelinePhase, PIPELINE_PHASES, PipelineEntry } from "@/hooks/useCommercialPipeline";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical, LayoutGrid, List, Building2, MapPin, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { CommercialStatus } from "@/hooks/useBusinesses";
import CommercialBusinessSheet from "./CommercialBusinessSheet";

const CommercialPipelineContent = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const isAdminUser = isAdmin || isSuperAdmin;
  const { data: pipeline = [], isLoading } = isAdminUser ? useAllPipeline() : useMyPipeline();
  const updatePhase = useUpdatePipelinePhase();
  const { toast } = useToast();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [dragItem, setDragItem] = useState<PipelineEntry | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const groupedByPhase = PIPELINE_PHASES.map(phase => ({
    ...phase,
    items: pipeline.filter(p => p.phase === phase.value),
  }));

  const handleDragStart = (e: React.DragEvent, item: PipelineEntry) => {
    setDragItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetPhase: CommercialStatus) => {
    e.preventDefault();
    if (!dragItem || dragItem.phase === targetPhase) {
      setDragItem(null);
      return;
    }
    try {
      await updatePhase.mutateAsync({ business_id: dragItem.business_id, phase: targetPhase });
      toast({ title: `Movido para "${PIPELINE_PHASES.find(p => p.value === targetPhase)?.label}"` });
    } catch {
      toast({ title: "Erro ao mover", variant: "destructive" });
    }
    setDragItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  };

  const renderCard = (item: PipelineEntry) => {
    const biz = item.businesses;
    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => setSelectedBusinessId(item.business_id)}
        className="bg-card rounded-lg p-3 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{biz?.name || "—"}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {biz?.city && (
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{biz.city}</span>
              )}
              {biz?.categories?.name && (
                <span className="truncate">{biz.categories.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {item.next_followup_date && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Calendar className="h-2.5 w-2.5 mr-0.5" />
                  {formatDate(item.next_followup_date)}
                </Badge>
              )}
              {biz?.subscription_status === "active" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-success/10 text-success">Pago</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">🎯 Pipeline Comercial</h1>
          <p className="text-muted-foreground">{pipeline.length} negócios no pipeline</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            size="sm" variant={view === "kanban" ? "default" : "ghost"}
            onClick={() => setView("kanban")}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
          </Button>
          <Button
            size="sm" variant={view === "list" ? "default" : "ghost"}
            onClick={() => setView("list")}
            className="h-8"
          >
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {groupedByPhase.map(phase => (
            <div
              key={phase.value}
              className="flex-shrink-0 w-64 bg-muted/30 rounded-xl flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, phase.value)}
            >
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {phase.emoji} {phase.label}
                  </span>
                  <Badge variant="secondary" className={cn("text-xs", phase.color)}>
                    {phase.items.length}
                  </Badge>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
                {phase.items.map(renderCard)}
                {phase.items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem negócios</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Negócio</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Cidade</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fase</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Próx. Follow-up</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map(item => {
                  const biz = item.businesses;
                  const phaseConf = PIPELINE_PHASES.find(p => p.value === item.phase);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedBusinessId(item.business_id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {biz?.logo_url ? (
                            <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary/50" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{biz?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{biz?.city || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{biz?.categories?.name || "—"}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={cn("text-xs", phaseConf?.color)}>
                          {phaseConf?.emoji} {phaseConf?.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.next_followup_date ? formatDate(item.next_followup_date) : "—"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {biz?.cta_phone || biz?.cta_email || "—"}
                      </td>
                    </tr>
                  );
                })}
                {pipeline.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Pipeline vazio. Atribua negócios a si na lista de Negócios.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Business Detail Sheet */}
      <CommercialBusinessSheet
        businessId={selectedBusinessId}
        onClose={() => setSelectedBusinessId(null)}
      />
    </div>
  );
};

export default CommercialPipelineContent;
