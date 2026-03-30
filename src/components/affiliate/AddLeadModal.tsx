import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCheckLeadDuplicate, useCreateAffiliateLead } from "@/hooks/useAffiliateLeads";
import { Loader2, AlertTriangle } from "lucide-react";

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddLeadModal = ({ open, onOpenChange }: AddLeadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const checkDuplicate = useCheckLeadDuplicate();
  const createLead = useCreateAffiliateLead();

  const [form, setForm] = useState({
    business_name: "",
    contact_phone: "",
    contact_email: "",
    contact_website: "",
    city: "",
    notes: "",
  });
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const hasContact = form.contact_phone.trim() || form.contact_email.trim() || form.contact_website.trim();

  const handleSubmit = async () => {
    if (!form.business_name.trim() || !hasContact || !user?.id) return;

    setDuplicateError(null);
    setIsChecking(true);

    try {
      // Check duplicate first
      const dupResult = await checkDuplicate.mutateAsync({
        phone: form.contact_phone || undefined,
        email: form.contact_email || undefined,
        website: form.contact_website || undefined,
      });

      if (dupResult.is_duplicate) {
        setDuplicateError(
          `Este negócio já está registado por outro afiliado (campo: ${dupResult.duplicate_field}). Não é possível registar.`
        );
        setIsChecking(false);
        return;
      }

      // Create lead
      await createLead.mutateAsync({
        affiliate_id: user.id,
        business_name: form.business_name.trim(),
        contact_phone: form.contact_phone.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        contact_website: form.contact_website.trim() || undefined,
        city: form.city.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      toast({ title: "Lead registada com sucesso!" });
      setForm({ business_name: "", contact_phone: "", contact_email: "", contact_website: "", city: "", notes: "" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao registar lead", description: err.message, variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Nova Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do negócio *</Label>
            <Input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              placeholder="Ex: Restaurante O Bom Garfo"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Pelo menos um contacto é obrigatório:</p>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+351 912 345 678"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="contacto@negocio.pt"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={form.contact_website}
                onChange={(e) => setForm({ ...form, contact_website: e.target.value })}
                placeholder="https://negocio.pt"
              />
            </div>
          </div>

          <div>
            <Label>Cidade</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Lisboa"
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Informações adicionais sobre o negócio..."
              rows={3}
            />
          </div>

          {duplicateError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{duplicateError}</p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!form.business_name.trim() || !hasContact || isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A verificar...
              </>
            ) : (
              "Registar Lead"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;
