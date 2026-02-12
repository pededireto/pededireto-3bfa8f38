import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BusinessGrid from "@/components/BusinessGrid";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

interface PremiumBusinessBlockProps {
  config: Record<string, any> | null;
}

const PremiumBusinessBlock = ({ config }: PremiumBusinessBlockProps) => {
  const limit = config?.limite || 6;

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["premium-businesses-block", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(`*, categories(id, name, slug, icon), subcategories(id, name, slug)`)
        .eq("is_active", true)
        .eq("is_premium", true)
        .order("display_order", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as unknown as BusinessWithCategory[];
    },
  });

  if (!isLoading && businesses.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Negócios Premium</h2>
        <BusinessGrid businesses={businesses} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default PremiumBusinessBlock;
