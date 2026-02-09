import { useState, useEffect } from "react";
import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const EmergencyBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check last cache update
    if ("caches" in window) {
      caches.open("businesses-cache").then((cache) => {
        cache.keys().then((keys) => {
          if (keys.length > 0) {
            setLastUpdate(new Date());
          }
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  const emergencyCats = (settings?.emergency_categories || "Serviços,Saúde,Energia,Transportes").split(",").map(s => s.trim());

  return (
    <div className="bg-destructive text-destructive-foreground">
      <div className="container py-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          <h2 className="text-lg font-bold">Modo Emergência Ativo</h2>
          <WifiOff className="w-5 h-5" />
        </div>
        <p className="text-sm opacity-90 mb-3">
          Sem ligação à internet. A mostrar dados guardados localmente.
          {lastUpdate && (
            <span className="ml-1">
              Última atualização: {lastUpdate.toLocaleDateString("pt-PT")}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium opacity-75">Categorias prioritárias:</span>
          {emergencyCats.map((cat) => (
            <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
              {cat}
            </span>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-white/30 text-white hover:bg-white/10"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Tentar reconectar
        </Button>
      </div>
    </div>
  );
};

export default EmergencyBanner;
