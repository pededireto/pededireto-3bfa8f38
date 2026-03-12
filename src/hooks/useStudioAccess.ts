import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/usePermissions";

export interface StudioBusiness {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
}

export const useStudioAccess = () => {
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles();

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["studio-businesses", user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];

      if (isAdmin) {
        // Admin sees all businesses
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, slug, city, description, category_id, subcategory_id")
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data as StudioBusiness[];
      }

      // Regular user — get businesses via business_users using profile id
      const { data: profileData } = await supabase.rpc("get_my_profile_id" as any);
      if (!profileData) return [];

      const { data, error } = await supabase
        .from("business_users")
        .select("business:businesses(id, name, slug, city, description, category_id, subcategory_id)")
        .eq("user_id", profileData);

      if (error) throw error;
      return (data || [])
        .map((d: any) => d.business)
        .filter(Boolean) as StudioBusiness[];
    },
    enabled: !!user,
  });

  return { businesses, isAdmin, isLoading };
};
