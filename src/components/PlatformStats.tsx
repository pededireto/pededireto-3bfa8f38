import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FileText, ShieldCheck } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [bizRes, catRes, cityRes] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("businesses").select("city").eq("is_active", true).not("city", "is", null),
      ]);
      const uniqueCities = new Set((cityRes.data || []).map((b: any) => b.city)).size;
      return { businesses: bizRes.count || 0, categories: catRes.count || 0, cities: uniqueCities };
    },
    staleTime: 300000,
  });
};

const PlatformStats = () => {
  const { data: stats } = usePlatformStats();
  const { data: settings } = useSiteSettings();

  const items = [
    {
      icon: Building2,
      value: `${stats?.businesses || 0}+`,
      label: settings?.platform_stats_label_1 || "negócios registados",
    },
    {
      icon: FileText,
      value: `${stats?.categories || 0}+`,
      label: settings?.platform_stats_label_2 || "categorias de serviços",
    },
    {
      icon: ShieldCheck,
      value: "100%",
      label: settings?.platform_stats_label_4 || "grátis para consumidores",
    },
  ];

  return (
    <section className="py-6 bg-primary">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-primary-foreground">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none">{item.value}</p>
                <p className="text-xs text-primary-foreground/70">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
