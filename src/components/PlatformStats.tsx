import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FileText, ShieldCheck, MapPin } from "lucide-react";

interface Metric {
  enabled: boolean;
  label: string;
  value: string;
  suffix: string;
}

interface PlatformStatsProps {
  config?: {
    metrics?: Metric[];
    bg_color?: string;
  } | null;
}

const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [bizRes, catRes, cityRes] = await Promise.all([
        (supabase as any).from("businesses_public").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
        (supabase as any).from("businesses_public").select("city").not("city", "is", null),
      ]);
      const uniqueCities = new Set((cityRes.data || []).map((b: any) => b.city)).size;
      return { businesses: bizRes.count || 0, categories: catRes.count || 0, cities: uniqueCities };
    },
    staleTime: 300000,
  });
};

const ICONS = [Building2, MapPin, FileText, ShieldCheck];

const DEFAULT_METRICS: Metric[] = [
  { enabled: true, label: "negócios registados", value: "businesses", suffix: "+" },
  { enabled: true, label: "categorias de serviços", value: "categories", suffix: "+" },
  { enabled: true, label: "grátis para consumidores", value: "100%", suffix: "" },
];

const PlatformStats = ({ config }: PlatformStatsProps) => {
  const { data: stats } = usePlatformStats();

  const metrics = config?.metrics || DEFAULT_METRICS;
  const enabledMetrics = metrics.filter((m) => m.enabled);

  // Map known keys to real DB values
  const resolveValue = (m: Metric): string => {
    const v = m.value?.toLowerCase?.() || "";
    if (stats) {
      // If the value matches a known DB key, use real data
      if (v === "businesses" || v === "500" || v.includes("negócio")) return String(stats.businesses);
      if (v === "categories" || v === "30" || v.includes("categori")) return String(stats.categories);
      if (v === "cities" || v === "50" || v.includes("cidade")) return String(stats.cities);
    }
    return m.value;
  };

  const bgClass =
    config?.bg_color === "branco"
      ? "bg-card text-foreground"
      : config?.bg_color === "cinza"
        ? "bg-muted text-foreground"
        : "bg-primary text-primary-foreground";

  const subTextClass =
    config?.bg_color === "branco" || config?.bg_color === "cinza"
      ? "text-muted-foreground"
      : "text-primary-foreground/70";

  const iconBgClass =
    config?.bg_color === "branco" || config?.bg_color === "cinza"
      ? "bg-primary/10"
      : "bg-primary-foreground/15";

  if (enabledMetrics.length === 0) return null;

  return (
    <section className={`py-6 ${bgClass}`}>
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
          {enabledMetrics.map((m, i) => {
            const Icon = ICONS[i % ICONS.length];
            const displayValue = resolveValue(m);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${iconBgClass} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none">
                    {displayValue}{m.suffix}
                  </p>
                  <p className={`text-xs ${subTextClass}`}>{m.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
