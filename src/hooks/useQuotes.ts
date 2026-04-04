import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order?: number;
}

export interface Quote {
  id: string;
  business_id: string;
  number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  notes: string | null;
  validity_days: number;
  iva_rate: number;
  subtotal: number;
  iva_amount: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  items?: QuoteItem[];
}

export interface CreateQuotePayload {
  business_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  notes?: string;
  validity_days: number;
  iva_rate: number;
  subtotal: number;
  iva_amount: number;
  total: number;
  items: Omit<QuoteItem, "id" | "quote_id">[];
}

// Alias tipado para contornar tipos gerados desactualizados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─────────────────────────────────────────────
// LISTAGEM
// ─────────────────────────────────────────────

export const useBusinessQuotes = (businessId: string) =>
  useQuery<Quote[]>({
    queryKey: ["business-quotes", businessId],
    queryFn: async () => {
      const { data, error } = await db
        .from("business_quotes")
        .select(
          `
          *,
          items:business_quote_items(*)
        `,
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Quote[];
    },
    enabled: !!businessId,
  });

// ─────────────────────────────────────────────
// CRIAR
// ─────────────────────────────────────────────

export const useCreateQuote = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateQuotePayload) => {
      // 1. Contar orçamentos existentes para número sequencial
      const { count } = await db
        .from("business_quotes")
        .select("*", { count: "exact", head: true })
        .eq("business_id", payload.business_id);

      const number = `#${String((count ?? 0) + 1).padStart(3, "0")}`;

      // 2. Inserir orçamento
      const { data: quote, error: quoteError } = await db
        .from("business_quotes")
        .insert({
          business_id: payload.business_id,
          number,
          client_name: payload.client_name,
          client_email: payload.client_email || null,
          client_phone: payload.client_phone || null,
          notes: payload.notes || null,
          validity_days: payload.validity_days,
          iva_rate: payload.iva_rate,
          subtotal: payload.subtotal,
          iva_amount: payload.iva_amount,
          total: payload.total,
          status: "draft",
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 3. Inserir itens
      if (payload.items.length > 0) {
        const { error: itemsError } = await db.from("business_quote_items").insert(
          payload.items.map((item, idx) => ({
            quote_id: quote.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            sort_order: idx,
          })),
        );
        if (itemsError) throw itemsError;
      }

      return quote as Quote;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["business-quotes", variables.business_id] });
    },
  });
};

// ─────────────────────────────────────────────
// ACTUALIZAR STATUS
// ─────────────────────────────────────────────

export const useUpdateQuoteStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      quoteId,
      status,
      businessId,
    }: {
      quoteId: string;
      status: Quote["status"];
      businessId: string;
    }) => {
      const { error } = await db.from("business_quotes").update({ status }).eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["business-quotes", variables.businessId] });
    },
  });
};

// ─────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────

export const useDeleteQuote = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId, businessId }: { quoteId: string; businessId: string }) => {
      const { error } = await db.from("business_quotes").delete().eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["business-quotes", variables.businessId] });
    },
  });
};
