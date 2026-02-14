import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const AddBusinessToAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const claim = async (businessId: string) => {
    const { error } = await supabase.rpc("claim_business", { p_business_id: businessId });
    if (error) {
      toast({ title: "Erro ao reclamar negócio", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pedido de claim submetido!" });
    navigate("/business-dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Adicionar Negócio</h1>
        <p className="text-muted-foreground">Use a página de Claim para associar um negócio à sua conta.</p>
        <Button onClick={() => navigate("/claim-business")}>Reclamar Negócio</Button>
      </div>
    </div>
  );
};

export default AddBusinessToAccount;
