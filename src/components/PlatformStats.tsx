import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FolderOpen, MapPin, Shield } from "lucide-react";
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

      return {
        businesses: bizRes.count || 0,
        categories: catRes.count || 0,
        cities: uniqueCities,
      };
    },
    staleTime: 300000,
  });
};

const PlatformStats = () => {
  const { data: stats } = usePlatformStats();
  const { data: settings } = useSiteSettings();

  const title = settings?.platform_stats_title || "A plataforma que liga Portugal aos melhores profissionais";

  const items = [
    { icon: Building2, value: stats?.businesses || 0, label: settings?.platform_stats_label_1 || "negócios registados" },
    { icon: FolderOpen, value: stats?.categories || 0, label: settings?.platform_stats_label_2 || "categorias de serviços" },
    { icon: MapPin, value: stats?.cities || 0, label: settings?.platform_stats_label_3 || "cidades cobertas" },
    { icon: Shield, value: "100%", label: settings?.platform_stats_label_4 || "grátis para consumidores" },
  ];

  return (
    <section className="py-12 md:py-16 bg-[hsl(123_30%_18%)]">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
          {title}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-[hsl(33_100%_50%)]" />
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-white">
                {typeof item.value === "number" ? `${item.value}+` : item.value}
              </p>
              <p className="text-sm text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
