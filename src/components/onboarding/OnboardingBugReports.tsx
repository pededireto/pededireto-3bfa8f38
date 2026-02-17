import { useState } from "react";
import { useBugReports, useCreateBugReport, useUpdateBugStatus } from "@/hooks/useBugReports";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  investigating: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const OnboardingBugReports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: bugs = [], isPending } = useBugReports();
  const createBug = useCreateBugReport();
  const updateStatus = useUpdateBugStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Criar o bug report
      await createBug.mutateAsync({ title, description, priority });

      // 2. Criar alerta para os admins
      const { error: alertError } = await supabase
        .from("admin_alerts" as any)
        .insert({
          type: "bug_report",
          title: `🐛 Novo Bug: ${title}`,
          message: `Prioridade: ${priority}\n\n${description}`,
          severity: priority === "critical" ? "high" : priority === "high" ? "medium" : "low",
          metadata: {
            bug_title: title,
            bug_priority: priority,
            reported_by: user?.email || "unknown"
          }
        });

      if (alertError) {
        console.error("Erro ao criar alerta:", alertError);
      }

      toast({ 
        title: "Bug reportado", 
        description: "O bug foi registado e os admins foram notificados." 
      });
      
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Status atualizado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">🐛 Bugs</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Reportar Bug
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reportar Bug</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="Resumo do bug" 
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                  placeholder="Descreve o problema em detalhe..." 
                  rows={4} 
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createBug.isPending}>
                  {createBug.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reportar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bugs.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <Bug className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum bug reportado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugs.map((bug: any) => (
            <div key={bug.id} className="bg-card rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{bug.title}</h3>
                    <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[bug.priority] || ""}`}>
                      {bug.priority}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[bug.status] || ""}`}>
                      {bug.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{bug.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reportado por: {bug.reported_by_email || "—"} • {new Date(bug.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <Select value={bug.status} onValueChange={(v) => handleStatusChange(bug.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingBugReports;
