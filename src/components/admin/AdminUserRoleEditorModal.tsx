// src/components/admin/AdminUserRoleEditorModal.tsx
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
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
    <Modal open={open} onClose={onClose} title="Editar role do utilizador">
      <div className="space-y-4">
        <Select value={role} onValueChange={(v) => setRole(v)}>
          <SelectTrigger><SelectValue placeholder="Selecionar role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={setRoleMut.isLoading}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}
