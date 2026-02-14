import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useToast } from "@/hooks/use-toast";

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  initialRole?: string;
};

const ROLES = [
  { value: "user", label: "User" },
  { value: "comercial", label: "Comercial" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "cs", label: "CS" },
  { value: "onboarding", label: "Onboarding" },
  { value: "business_owner", label: "Business Owner" },
];

export default function AdminUserRoleEditorModal({ userId, open, onClose, initialRole }: Props) {
  const [role, setRole] = useState(initialRole || "user");
  const { setRole: setRoleMut } = useAdminUsers();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await setRoleMut.mutateAsync({ userId, role });
      toast({ title: `Role alterado para "${ROLES.find(r => r.value === role)?.label || role}"` });
      onClose();
    } catch (e: any) {
      toast({ title: "Erro ao alterar role", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar role do utilizador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={role} onValueChange={(v) => setRole(v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar role" /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={setRoleMut.isPending}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
