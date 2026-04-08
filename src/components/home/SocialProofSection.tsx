import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

interface SocialProofSectionProps {
  config?: Record<string, any> | null;
}

const SocialProofSection = ({ config }: SocialProofSectionProps) => {
  const title = config?.title || "Negócios já presentes na plataforma";
  const subtitle = config?.subtitle || "Junta-te a centenas de profissionais que já usam a plataforma para crescer.";
  const maxLogos = config?.max_logos || 8;

  const { data: businesses = [] } = useQuery({
    queryKey: ["social-proof-logos", maxLogos],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses" as any)
        .select("id, name, logo_url")
        .eq("is_active", true)
        .not("logo_url", "is", null)
        .order("average_rating", { ascending: false })
        .limit(maxLogos);
      return (data as any[]) || [];
    },
    staleTime: 300000,
  });

  // If no logos, show business names in styled pills
  const { data: topBusinesses = [] } = useQuery({
    queryKey: ["social-proof-names", maxLogos],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses" as any)
        .select("id, name")
        .eq("is_active", true)
        .eq("is_verified", true)
        .order("average_rating", { ascending: false })
        .limit(maxLogos);
      return (data as any[]) || [];
    },
    staleTime: 300000,
    enabled: businesses.length === 0,
  });

  const items = businesses.length > 0 ? businesses : topBusinesses;

  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-card">
      <div className="container text-center space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">{subtitle}</p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {items.map((biz: any) =>
            biz.logo_url ? (
              <div key={biz.id} className="w-24 h-16 rounded-xl bg-muted/50 border border-border flex items-center justify-center p-2">
                <img src={biz.logo_url} alt={biz.name} className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            ) : (
              <div key={biz.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{biz.name}</span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
