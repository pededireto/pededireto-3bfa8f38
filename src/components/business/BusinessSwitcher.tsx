import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";

export default function BusinessSwitcher() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { list } = useUserBusinesses(user?.id);
  const [active, setActive] = useState<string | null>(localStorage.getItem("activeBusinessId"));

  const switchTo = (id: string) => {
    localStorage.setItem("activeBusinessId", id);
    setActive(id);
    qc.invalidateQueries({ queryKey: ["business", "analytics", id] });
    window.location.href = `/business/${id}`;
  };

  if (!list.data || list.data.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <select value={active ?? ""} onChange={(e) => switchTo(e.target.value)} className="p-2 border rounded bg-background text-foreground">
        {list.data.map((bu: any) => (
          <option key={bu.business_id} value={bu.business_id}>
            {bu.business?.name} {bu.role === "pending_owner" ? "(pendente)" : ""}
          </option>
        ))}
      </select>
      <button onClick={() => window.location.href = "/business/add"} className="text-sm text-primary underline">
        Adicionar negócio
      </button>
    </div>
  );
}
