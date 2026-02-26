import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Tickets (agora usa a view com contexto do pedido) ──

export const useTickets = (department?: string, showAll = false) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support-tickets", department, showAll, user?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from("support_tickets_with_context")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!showAll && department) {
        query = query.or(`assigned_to_department.eq.${department},created_by.eq.${user?.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });
};

export const useTicketStats = (department?: string) => {
  const { data: tickets = [] } = useTickets(department);

  const active = tickets.filter((t: any) => !["resolved", "closed"].includes(t.status));
  const open = tickets.filter((t: any) => t.status === "open");
  const inProgress = tickets.filter((t: any) => t.status === "in_progress");
  const waitingResponse = tickets.filter((t: any) => t.status === "waiting_response");
  const escalated = tickets.filter((t: any) => t.status === "escalated");
  const resolved = tickets.filter((t: any) => t.status === "resolved");
  const pendingResponse = tickets.filter(
    (t: any) => !t.first_response_at && t.status !== "closed" && t.status !== "resolved",
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentWithResponse = tickets.filter((t: any) => t.first_response_at && new Date(t.created_at) >= thirtyDaysAgo);
  const avgResponseMin =
    recentWithResponse.length > 0
      ? Math.round(
          recentWithResponse.reduce((acc: number, t: any) => {
            return acc + (new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime()) / 60000;
          }, 0) / recentWithResponse.length,
        )
      : 0;

  const recentTotal = tickets.filter((t: any) => new Date(t.created_at) >= thirtyDaysAgo);
  const recentResolved = recentTotal.filter((t: any) => t.status === "resolved" || t.status === "closed");
  const resolutionRate = recentTotal.length > 0 ? Math.round((recentResolved.length / recentTotal.length) * 100) : 0;

  return {
    activeCount: active.length,
    openCount: open.length,
    inProgressCount: inProgress.length,
    waitingResponseCount: waitingResponse.length,
    escalatedCount: escalated.length,
    resolvedCount: resolved.length,
    pendingResponseTickets: pendingResponse.slice(0, 10),
    avgResponseMin,
    resolutionRate,
    tickets,
  };
};

export const useCreateTicket = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ticket: {
      title: string;
      description: string;
      assigned_to_department: string;
      business_id?: string;
      priority?: string;
      category?: string;
      created_by_role?: string;
      request_id?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("support_tickets")
        .insert({
          ...ticket,
          created_by: user?.id,
          priority: ticket.priority || "medium",
          status: "open",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await (supabase as any)
        .from("support_tickets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};

// ── Messages ──

export const useTicketMessages = (ticketId: string | null) => {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!ticketId,
    refetchInterval: 15000,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      ticketId,
      message,
      isInternalNote,
      userRole,
    }: {
      ticketId: string;
      message: string;
      isInternalNote?: boolean;
      userRole?: string;
    }) => {
      const { error } = await (supabase as any).from("support_ticket_messages").insert({
        ticket_id: ticketId,
        user_id: user?.id,
        message,
        is_internal_note: isInternalNote || false,
        user_role: userRole || "cs",
      });
      if (error) throw error;

      // Actualizar first_response_at se for a primeira resposta do staff
      if (!isInternalNote) {
        const { data: ticket } = await (supabase as any)
          .from("support_tickets")
          .select("first_response_at")
          .eq("id", ticketId)
          .single();

        if (ticket && !ticket.first_response_at) {
          await (supabase as any)
            .from("support_tickets")
            .update({ first_response_at: new Date().toISOString() })
            .eq("id", ticketId);
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["ticket-messages", vars.ticketId] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};

// ── Templates ──

export const useTicketTemplates = () => {
  return useQuery({
    queryKey: ["ticket-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ticket_response_templates")
        .select("*")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// ── Ticket Notifications ──

export const useTicketNotifications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ticket-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ticket_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const useUnreadTicketNotifCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ticket-notifications-unread", user?.id],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("ticket_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const useMarkTicketNotifRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("ticket_notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-notifications"] });
      qc.invalidateQueries({ queryKey: ["ticket-notifications-unread"] });
    },
  });
};

export const useMarkAllTicketNotifsRead = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("ticket_notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-notifications"] });
      qc.invalidateQueries({ queryKey: ["ticket-notifications-unread"] });
    },
  });
};

// ── SLA Violations ──

export const useSlaViolations = (department?: string) => {
  return useQuery({
    queryKey: ["sla-violations", department],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tickets_sla_violations")
        .select("*")
        .order("hours_open", { ascending: false })
        .limit(20);

      if (department) query = query.eq("assigned_to_department", department);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });
};

// ── Ticket History ──

export const useTicketHistory = (ticketId: string | null) => {
  return useQuery({
    queryKey: ["ticket-history", ticketId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ticket_history_detailed")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!ticketId,
  });
};

// ── Profiles lookup ──

export const useProfilesLookup = (userIds: string[]) => {
  return useQuery({
    queryKey: ["profiles-lookup", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p) => {
        map[p.user_id] = p;
      });
      return map;
    },
    enabled: userIds.length > 0,
  });
};
