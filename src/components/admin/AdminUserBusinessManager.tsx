// src/components/admin/AdminUserBusinessManager.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";
import { useUnlinkedBusinesses } from "@/hooks/useUnlinkedBusinesses";

type Props = { userId: string };

export default function AdminUserBusinessManager({ userId }: Props) {
  const { query, assign, remove } = useUserBusinesses(userId);
  const [search, setSearch] = useState("");
  const unlinked = useUnlinkedBusinesses(search);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Negócios associados</h3>
      <div>
        {query.query.isLoading ? (
          <p>Loading…</p>
        ) : (
          query.query.data?.map((bu: any) => (
            <div key={bu.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium">{bu.business.name}</div>
                <div className="text-xs text-muted-foreground">{bu.business.city} • {bu.role}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => remove.remove({ businessId: bu.business_id, userId })}>Remover</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <h4>Adicionar negócio</h4>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar negócio..." className="w-full p-2 border rounded" />
      <div className="max-h-48 overflow-auto">
        {unlinked.isLoading ? <p>Carregando…</p> : unlinked.data?.map((b: any) => (
          <div key={b.id} className="flex items-center justify-between p-2 border-b">
            <div>
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.city}</div>
            </div>
            <div>
              <Button onClick={() => assign.mutate({ businessId: b.id, userId, role: "owner" })}>Associar como Owner</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
