import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateTicket } from "@/hooks/useTickets";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDepartment?: string;
  defaultBusinessId?: string;
  defaultBusinessName?: string;
  allowedDepartments?: string[];
  creatorRole?: string;
}

const CreateTicketDialog = ({
  open,
  onOpenChange,
  defaultDepartment = "cs",
  defaultBusinessId,
  defaultBusinessName,
  allowedDepartments = ["cs", "commercial", "onboarding", "it_admin"],
  creatorRole = "cs",
}: CreateTicketDialogProps) => {
  const { toast } = useToast();
  const createTicket = useCreateTicket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(defaultDepartment);
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("outro");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicket.mutateAsync({
        title,
        description,
        assigned_to_department: department,
        business_id: defaultBusinessId || undefined,
        priority,
        category,
        created_by_role: creatorRole,
      });
      toast({ title: "✅ Ticket criado com sucesso!" });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setCategory("outro");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const deptLabels: Record<string, string> = {
    cs: "💬 Customer Success",
    commercial: "🏪 Comercial",
    onboarding: "🎯 Onboarding",
    it_admin: "🔧 IT / Admin",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>➕ Novo Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Resumo do problema" />
          </div>
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Descreve o problema em detalhe..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Departamento destino</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{deptLabels[d] || d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="faturacao">Faturação</SelectItem>
                  <SelectItem value="conta">Conta</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="upgrade_plano">Upgrade Plano</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {defaultBusinessName && (
              <div className="space-y-2">
                <Label>Negócio</Label>
                <Input value={defaultBusinessName} disabled className="bg-muted" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;
