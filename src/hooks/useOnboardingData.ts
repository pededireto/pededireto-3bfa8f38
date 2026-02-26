import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

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

// ── Paginação infinita de negócios ──────────────────────────────────────────
export const useOnboardingBusinesses = (filters?: { claimStatus?: string; isActive?: string; search?: string }) => {
  return useInfiniteQuery({
    queryKey: ["onboarding-businesses", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("businesses")
        .select("id, name, city, slug, is_active, claim_status, created_at, owner_id, owner_email, owner_name", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters?.claimStatus && filters.claimStatus !== "all") {
        query = query.eq("claim_status", filters.claimStatus);
      }
      if (filters?.isActive === "true") query = query.eq("is_active", true);
      if (filters?.isActive === "false") query = query.eq("is_active", false);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page: pageParam,
        hasMore: (data || []).length === PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
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

      const userIds = [...new Set((data || []).map((d: any) => d.user_id))];
      const businessIds = [...new Set((data || []).map((d: any) => d.business_id))];

      const [profilesRes, businessesRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds)
          : { data: [] },
        businessIds.length > 0 ? supabase.from("businesses").select("id, name").in("id", businessIds) : { data: [] },
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => {
        profileMap[p.user_id] = p;
      });
      const businessMap: Record<string, any> = {};
      (businessesRes.data || []).forEach((b: any) => {
        businessMap[b.id] = b;
      });

      return (data || []).map((c: any) => ({
        ...c,
        user_name: profileMap[c.user_id]?.full_name || "",
        user_email: profileMap[c.user_id]?.email || "",
        business_name: businessMap[c.business_id]?.name || "",
      }));
    },
  });
};

// ── Tickets de consumidores para o Onboarding ───────────────────────────────
export const useOnboardingConsumerTickets = () => {
  return useQuery({
    queryKey: ["onboarding-consumer-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets" as any)
        .select("*, businesses(name)")
        .or("assigned_to_department.eq.it_admin,assigned_to_department.eq.onboarding")
        .eq("category", "onboarding")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
};
