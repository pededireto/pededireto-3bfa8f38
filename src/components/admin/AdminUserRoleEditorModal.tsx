import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  initialRole?: string;
};

export default function AdminUserRoleEditorModal({ userId, open, onClose, initialRole }: Props) {
  const [role, setRole] = useState(initialRole || "user");
  const { setRole: setRoleMut } = useAdminUsers();

  const handleSave = async () => {
    await setRoleMut.mutateAsync({ userId, role });
    onClose();
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
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="cs">CS</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
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
