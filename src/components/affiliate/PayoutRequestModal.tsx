import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Coins, Loader2 } from "lucide-react";

interface PayoutRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionId: string;
  affiliateId: string;
  amount: number;
}

const PayoutRequestModal = ({ open, onOpenChange, commissionId, affiliateId, amount }: PayoutRequestModalProps) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<"choose" | "bank" | "credits">("choose");
  const [iban, setIban] = useState("");
  const [holderName, setHolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBankTransfer = async () => {
    if (!iban.trim() || !holderName.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("affiliate_commissions" as any)
        .update({
          payment_method: "bank_transfer",
          iban: iban.trim(),
        })
        .eq("id", commissionId);
      if (error) throw error;

      toast({ title: "Pedido de pagamento registado", description: "O administrador irá processar a transferência." });
      qc.invalidateQueries({ queryKey: ["affiliate-commissions"] });
      onOpenChange(false);
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredits = async () => {
    setIsSubmitting(true);
    try {
      // Add credits
      const { error: creditErr } = await supabase
        .from("affiliate_credits" as any)
        .insert({
          user_id: affiliateId,
          amount,
          description: "Comissão de afiliado convertida em créditos",
          commission_id: commissionId,
        });
      if (creditErr) throw creditErr;

      // Mark as paid
      const { error: commErr } = await supabase
        .from("affiliate_commissions" as any)
        .update({
          status: "paid",
          payment_method: "platform_credits",
          paid_at: new Date().toISOString(),
        })
        .eq("id", commissionId);
      if (commErr) throw commErr;

      toast({ title: "Créditos adicionados!", description: `${amount.toFixed(2)}€ em créditos foram adicionados à tua conta.` });
      qc.invalidateQueries({ queryKey: ["affiliate-commissions"] });
      qc.invalidateQueries({ queryKey: ["affiliate-credits"] });
      qc.invalidateQueries({ queryKey: ["affiliate-stats"] });
      onOpenChange(false);
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Pagamento — {amount.toFixed(2)}€</DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Como pretendes receber?</p>
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setStep("bank")}>
              <CreditCard className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium">Transferência Bancária</p>
                <p className="text-xs text-muted-foreground">Indica o IBAN e o admin processa a transferência</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setStep("credits")}>
              <Coins className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium">Créditos na Plataforma</p>
                <p className="text-xs text-muted-foreground">Créditos adicionados imediatamente para promover negócios</p>
              </div>
            </Button>
          </div>
        )}

        {step === "bank" && (
          <div className="space-y-4">
            <div>
              <Label>IBAN *</Label>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" />
            </div>
            <div>
              <Label>Nome do titular *</Label>
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Nome completo" />
            </div>
            <p className="text-sm text-muted-foreground">
              Valor a receber: <strong>{amount.toFixed(2)}€</strong>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("choose")} className="flex-1">Voltar</Button>
              <Button onClick={handleBankTransfer} disabled={!iban.trim() || !holderName.trim() || isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar pedido"}
              </Button>
            </div>
          </div>
        )}

        {step === "credits" && (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm">
                Os créditos são adicionados imediatamente e podem ser usados para promover os teus negócios na plataforma.
              </p>
              <p className="mt-2 text-lg font-bold">Valor em créditos: {amount.toFixed(2)}€</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("choose")} className="flex-1">Voltar</Button>
              <Button onClick={handleCredits} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar → adicionar créditos"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRequestModal;
