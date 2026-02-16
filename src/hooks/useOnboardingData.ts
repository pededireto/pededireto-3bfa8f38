import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOnboardingStats = () => {
  return useQuery({
    queryKey: ["onboarding-stats"],
    queryFn: async () => {
      const [profilesRes, businessesRes, bugsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("businesses").select("id, claim_status, is_active", { count: "exact" }),
        supabase.from("bug_reports").select("id, status", { count: "exact" }),
      ]);

      const businesses = businessesRes.data || [];
      const bugs = bugsRes.data || [];

      return {
        totalUsers: profilesRes.count || 0,
        totalBusinesses: businesses.length,
        claimedBusinesses: businesses.filter((b: any) => b.claim_status === "verified").length,
        unclaimedBusinesses: businesses.filter((b: any) => b.claim_status === "unclaimed" || !b.claim_status).length,
        activeBusinesses: businesses.filter((b: any) => b.is_active).length,
        openBugs: bugs.filter((b: any) => b.status === "pending" || b.status === "investigating").length,
        totalBugs: bugs.length,
      };
    },
  });
};

export const useOnboardingUsers = () => {
  return useQuery({
    queryKey: ["onboarding-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_users_summary" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useOnboardingBusinesses = (filters?: { claimStatus?: string; isActive?: string; city?: string; search?: string }) => {
  return useQuery({
    queryKey: ["onboarding-businesses", filters],
    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select("id, name, city, slug, is_active, claim_status, created_at, owner_id, owner_email, owner_name")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.claimStatus && filters.claimStatus !== "all") {
        query = query.eq("claim_status", filters.claimStatus);
      }
      if (filters?.isActive === "true") query = query.eq("is_active", true);
      if (filters?.isActive === "false") query = query.eq("is_active", false);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useBulkUpdateBusinessStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { error } = await supabase
        .from("businesses")
        .update({ is_active } as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-businesses"] }),
  });
};

export const useOnboardingConnections = () => {
  return useQuery({
    queryKey: ["onboarding-connections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_users")
        .select("id, business_id, user_id, role, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      // Enrich with profile and business names
      const userIds = [...new Set((data || []).map((d: any) => d.user_id))];
      const businessIds = [...new Set((data || []).map((d: any) => d.business_id))];

      const [profilesRes, businessesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds) : { data: [] },
        businessIds.length > 0 ? supabase.from("businesses").select("id, name").in("id", businessIds) : { data: [] },
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      const businessMap: Record<string, any> = {};
      (businessesRes.data || []).forEach((b: any) => { businessMap[b.id] = b; });

      return (data || []).map((c: any) => ({
        ...c,
        user_name: profileMap[c.user_id]?.full_name || "",
        user_email: profileMap[c.user_id]?.email || "",
        business_name: businessMap[c.business_id]?.name || "",
      }));
    },
  });
};
