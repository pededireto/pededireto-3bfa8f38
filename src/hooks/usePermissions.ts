import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUserPermissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission, role")
        .in("role", 
          (await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
          ).data?.map(r => r.role) || []
        );
      
      if (error) throw error;
      return [...new Set((data || []).map(r => r.permission))];
    },
    enabled: !!user,
  });
};

export const useHasPermission = (permission: string) => {
  const { data: permissions = [] } = useUserPermissions();
  return permissions.includes(permission);
};

export const useUserRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-all-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map(r => r.role);
    },
    enabled: !!user,
  });
};
