import { useState } from "react";
import { useContactLogs, useCreateContactLog } from "@/hooks/useContactLogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Phone, Mail, MessageCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContactLogsDialogProps {
  businessId: string;
  businessName: string;
}

const tipoIcons: Record<string, React.ElementType> = {
  telefone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  outro: MessageSquare,
};

const tipoLabels: Record<string, string> = {
  telefone: "Telefone",
  email: "Email",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

const ContactLogsDialog = ({ businessId, businessName }: ContactLogsDialogProps) => {
  const { toast } = useToast();
  const { data: logs = [], isLoading } = useContactLogs(businessId);
  const createLog = useCreateContactLog();
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("telefone");
  const [nota, setNota] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLog.mutateAsync({
        business_id: businessId,
        tipo_contacto: tipo,
        nota: nota || undefined,
      });
      toast({ title: "Contacto registado" });
      setShowForm(false);
      setNota("");
      setTipo("telefone");
    } catch {
      toast({ title: "Erro ao registar contacto", variant: "destructive" });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Histórico de contactos">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contactos — {businessName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new contact */}
          {!showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Registar contacto
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <Label>Tipo de contacto</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nota</Label>
                <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Detalhes do contacto..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createLog.isPending}>
                  {createLog.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Guardar
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Log history */}
          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem histórico de contactos.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = tipoIcons[log.tipo_contacto] || MessageSquare;
                return (
                  <div key={log.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {tipoLabels[log.tipo_contacto] || log.tipo_contacto}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString("pt-PT", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {log.nota && <p className="text-sm text-foreground">{log.nota}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactLogsDialog;
