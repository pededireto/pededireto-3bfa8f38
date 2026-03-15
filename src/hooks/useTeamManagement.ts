import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  user_id: string;
  role: string;
  role_created_at: string;
  full_name: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
}

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-commercial-user", {
        body: { action: "list_team" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.members || []) as TeamMember[];
    },
  });
};

export const useCreateTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, full_name, role }: { email: string; password: string; full_name: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-commercial-user", {
        body: { action: "create", email, password, full_name, role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
    onError: (error: any) => {
      console.error("[useCreateTeamMember] error:", error);
    },
  });
};

export const useDeleteTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-commercial-user", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
    onError: (error: any) => {
      console.error("[useDeleteTeamMember] error:", error);
    },
  });
};
