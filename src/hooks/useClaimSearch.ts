import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClaimResult {
  id: string;
  name: string;
  city: string | null;
  category_id: string | null;
  is_active: boolean;
  legal_fields_count: number;
}

export const useClaimSearch = (query: string) => {
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_businesses_for_claim", {
          p_query: query,
          p_limit: 10,
        });
        if (!error && data) {
          setResults(data as ClaimResult[]);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, isLoading };
};

export const useClaimBusiness = () => {
  const [isLoading, setIsLoading] = useState(false);

  const claim = async (businessId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc("claim_business", {
        p_business_id: businessId,
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return { claim, isLoading };
};
