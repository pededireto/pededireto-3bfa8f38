import { useState } from "react";
import { Briefcase, Plus, Loader2, Eye, Users, RotateCcw, Trash2, Edit, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useBusinessJobOffers,
  useCreateJobOffer,
  useUpdateJobOffer,
  useDeleteJobOffer,
  useRepublishJobOffer,
  type JobOffer,
} from "@/hooks/useJobOffers";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";

const JOB_TYPES: Record<string, string> = {
  full_time: "Tempo Inteiro",
  part_time: "Part-time",
  temporary: "Temporário",
  freelance: "Freelance",
  internship: "Estágio",
};

interface Props {
  businessId: string;
}

const emptyForm = { title: "", description: "", city: "", type: "full_time", salary_range: "", contact_email: "", contact_phone: "" };

const BusinessJobOffersContent = ({ businessId }: Props) => {
  const { data: offers = [], isLoading } = useBusinessJobOffers(businessId);
  const createMut = useCreateJobOffer();
  const updateMut = useUpdateJobOffer();
  const deleteMut = useDeleteJobOffer();
  const republishMut = useRepublishJobOffer();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const now = new Date();
  const active = offers.filter((o) => o.is_active && new Date(o.expires_at) > now);
  const expired = offers.filter((o) => !o.is_active || new Date(o.expires_at) <= now);

  const openCreate = () => {
    if (active.length >= 3) { toast.error("Máximo de 3 ofertas activas."); return; }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (o: JobOffer) => {
    setForm({
      title: o.title,
      description: o.description,
      city: o.city,
      type: o.type,
      salary_range: o.salary_range || "",
      contact_email: o.contact_email || "",
      contact_phone: o.contact_phone || "",
    });
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (form.title.length < 5) { toast.error("Título deve ter pelo menos 5 caracteres."); return; }
    if (form.description.length < 30) { toast.error("Descrição deve ter pelo menos 30 caracteres."); return; }
    if (!form.city.trim()) { toast.error("Cidade é obrigatória."); return; }

    if (editingId) {
      updateMut.mutate({ id: editingId, ...form } as any, { onSuccess: () => setShowForm(false) });
    } else {
      createMut.mutate({ business_id: businessId, ...form }, { onSuccess: () => setShowForm(false) });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Ofertas de Emprego</h1>
          <Badge variant="outline">{active.length}/3 activas</Badge>
        </div>
        <Button onClick={openCreate} disabled={active.length >= 3}>
          <Plus className="h-4 w-4 mr-1" /> Nova Oferta
        </Button>
      </div>

      {/* Active offers */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ofertas Activas</CardTitle></CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem ofertas activas. Crie a primeira!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Visualizações</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.title}</TableCell>
                    <TableCell>{o.city}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{o.views_count}</span></TableCell>
                    <TableCell><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{o.applications_count}</span></TableCell>
                    <TableCell>{differenceInDays(new Date(o.expires_at), now)} dias</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(o)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expired */}
      {expired.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Ofertas Expiradas / Inactivas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expired.map((o) => (
                  <TableRow key={o.id} className="opacity-60">
                    <TableCell>{o.title}</TableCell>
                    <TableCell>{o.city}</TableCell>
                    <TableCell>{o.views_count}</TableCell>
                    <TableCell>{o.applications_count}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => republishMut.mutate(o.id)} disabled={active.length >= 3}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Republicar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMut.mutate(o.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Oferta" : "Nova Oferta de Emprego"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Cozinheiro(a)" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição * (mín. 30 caracteres)</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Descreva a função, requisitos, horário..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cidade *</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Lisboa" />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOB_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Faixa salarial (opcional)</label>
              <Input value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} placeholder="Ex: 900€ - 1200€" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Email de contacto</label>
                <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="rh@empresa.pt" />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone de contacto</label>
                <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+351 900 000 000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "Guardar" : "Criar Oferta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessJobOffersContent;
