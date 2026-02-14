import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";
import { useUnlinkedBusinesses } from "@/hooks/useUnlinkedBusinesses";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
};

export default function AdminUserBusinessManager({ userId, open, onClose }: Props) {
  const { list, assign, remove } = useUserBusinesses(userId);
  const [search, setSearch] = useState("");
  const unlinked = useUnlinkedBusinesses(search);
  const { toast } = useToast();

  const handleAssign = async (businessId: string, businessName: string) => {
    try {
      await assign.mutateAsync({ businessId, userId, role: "owner" });
      toast({ title: `"${businessName}" associado com sucesso` });
    } catch (e: any) {
      toast({ title: "Erro ao associar negócio", description: e?.message, variant: "destructive" });
    }
  };

  const handleRemove = async (businessId: string, businessName: string) => {
    try {
      await remove.mutateAsync({ businessId, userId });
      toast({ title: `"${businessName}" removido` });
    } catch (e: any) {
      toast({ title: "Erro ao remover negócio", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Negócios associados</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {list.isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (list.data && list.data.length > 0) ? (
            list.data.map((bu: any) => (
              <div key={bu.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{bu.business?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{bu.business?.city} • {bu.role}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(bu.business_id, bu.business?.name || "")}
                  disabled={remove.isPending}
                >
                  Remover
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum negócio associado.</p>
          )}

          <h4 className="font-medium pt-2">Adicionar negócio</h4>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar negócio..."
          />
          <div className="max-h-48 overflow-auto space-y-1">
            {unlinked.isLoading ? (
              <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : (
              (unlinked.data || []).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <div className="font-medium text-sm">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.city}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(b.id, b.name)}
                    disabled={assign.isPending}
                  >
                    Associar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
