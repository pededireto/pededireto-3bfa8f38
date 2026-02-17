import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useClaimBusiness } from "@/hooks/useBusinessClaim";
import { useToast } from "@/hooks/use-toast";

interface ClaimBusinessDialogProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClaimBusinessDialog = ({ businessId, businessName, open, onOpenChange }: ClaimBusinessDialogProps) => {
  const { toast } = useToast();
  const claim = useClaimBusiness();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!name || !email) {
      toast({ title: "Preencha nome e email", variant: "destructive" });
      return;
    }

    try {
      await claim.mutateAsync({
        business_id: businessId,
        claimed_for_name: name,
        claimed_for_email: email,
        claimed_for_phone: phone,
        offered_plan: "1_month",
        trial_months: 1,
        notes,
      });

      toast({ title: "Negócio reclamado com sucesso!" });
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao reclamar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reclamar: {businessName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do dono *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.pt" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 9..." />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notas adicionais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={claim.isPending}>
            <CheckCircle className="w-4 h-4" />
            Reclamar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
