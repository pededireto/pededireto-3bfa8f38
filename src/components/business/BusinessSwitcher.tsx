import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useUserBusinesses } from "@/hooks/useUserBusinesses";
import { supabase } from "@/integrations/supabase/client";

export default function BusinessSwitcher() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // FIX: useUserBusinesses espera profiles.id, não auth.uid().
  // Resolvemos o profiles.id antes de passar ao hook.
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileId(data?.id ?? user.id);
      });
  }, [user?.id]);

  const { list } = useUserBusinesses(profileId ?? undefined);

  const [active, setActive] = useState<string | null>(localStorage.getItem("activeBusinessId"));

  // Definir o negócio ativo por defeito quando a lista carrega
  useEffect(() => {
    if (!list.data || list.data.length === 0) return;
    const stored = localStorage.getItem("activeBusinessId");
    const validStored = list.data.some((bu: any) => bu.business_id === stored);
    if (!validStored) {
      const first = list.data[0].business_id;
      localStorage.setItem("activeBusinessId", first);
      setActive(first);
    }
  }, [list.data]);

  const switchTo = (id: string) => {
    localStorage.setItem("activeBusinessId", id);
    setActive(id);
    // Invalidar queries do negócio anterior e recarregar o dashboard
    qc.invalidateQueries({ queryKey: ["business-by-user"] });
    qc.invalidateQueries({ queryKey: ["business-analytics", id] });
    qc.invalidateQueries({ queryKey: ["business-membership"] });
    // Recarregar a página para garantir que todos os hooks atualizam
    window.location.reload();
  };

  if (!list.data || list.data.length <= 1) return null;

  return (
    <div className="flex items-center gap-3">
      <select
        value={active ?? ""}
        onChange={(e) => switchTo(e.target.value)}
        className="p-2 border rounded bg-background text-foreground text-sm"
      >
        {list.data.map((bu: any) => (
          <option key={bu.business_id} value={bu.business_id}>
            {bu.business?.name}
            {bu.role === "pending_owner" ? " (pendente)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
