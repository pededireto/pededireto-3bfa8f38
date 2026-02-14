// src/components/business/BusinessSwitcher.tsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";

export default function BusinessSwitcher() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { query } = useUserBusinesses(user?.id);
  const [active, setActive] = useState<string | null>(localStorage.getItem("activeBusinessId"));

  const switchTo = (id: string) => {
    localStorage.setItem("activeBusinessId", id);
    setActive(id);
    qc.invalidateQueries(["business","analytics", id]);
    // optional: push state or reload
    window.location.href = `/business/${id}`;
  };

  if (!query.query.data || query.query.data.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <select value={active ?? ""} onChange={(e) => switchTo(e.target.value)} className="p-2 border rounded">
        {query.query.data.map((bu: any) => (
          <option key={bu.business_id} value={bu.business_id}>
            {bu.business.name} {bu.role === "pending_owner" ? "(pendente)" : ""}
          </option>
        ))}
      </select>
      <button onClick={() => window.location.href = "/business/add"} className="btn">Adicionar negócio</button>
    </div>
  );
}
