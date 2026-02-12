import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    const value = granted ? "granted" : "denied";
    try {
      localStorage.setItem("cookie_consent", value);
    } catch {}

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value,
      });
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-lg p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground flex-1">
          Utilizamos cookies para melhorar a sua experiência e analisar o tráfego do site.
          Ao aceitar, consente a utilização de cookies analíticos e publicitários conforme a nossa política de privacidade.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => updateConsent(false)}>
            Recusar
          </Button>
          <Button size="sm" onClick={() => updateConsent(true)}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
