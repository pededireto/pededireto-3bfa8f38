import { useState, useEffect, useCallback } from "react";
import FeaturePopup, { BUSINESS_POPUPS, type FeaturePopupProps } from "./FeaturePopup";

interface FeaturePopupManagerProps {
  audience: "business" | "consumer";
  onTabNavigate?: (tab: string) => void;
}

const STORAGE_PREFIX = "popup_seen_";

const FeaturePopupManager = ({ audience, onTabNavigate }: FeaturePopupManagerProps) => {
  const [activePopup, setActivePopup] = useState<typeof BUSINESS_POPUPS[0] | null>(null);

  useEffect(() => {
    // Show max 1 popup per session — find the first unseen one
    const popups = audience === "business" ? BUSINESS_POPUPS : [];
    const unseen = popups.find(
      (p) => !localStorage.getItem(`${STORAGE_PREFIX}${p.id}`)
    );

    if (unseen) {
      // Small delay to not interrupt initial page load
      const timer = setTimeout(() => setActivePopup(unseen), 1500);
      return () => clearTimeout(timer);
    }
  }, [audience]);

  const handleClose = useCallback(() => {
    setActivePopup(null);
  }, []);

  const handleCta = useCallback(() => {
    if (!activePopup) return;
    if ((activePopup as any).ctaTab && onTabNavigate) {
      onTabNavigate((activePopup as any).ctaTab);
    } else if (activePopup.ctaHref) {
      window.location.href = activePopup.ctaHref;
    }
  }, [activePopup, onTabNavigate]);

  if (!activePopup) return null;

  return (
    <FeaturePopup
      id={activePopup.id}
      trigger="manual"
      forceOpen={true}
      title={activePopup.title}
      subtitle={activePopup.subtitle}
      accentColor={activePopup.accentColor}
      icon={activePopup.icon}
      steps={activePopup.steps}
      tip={activePopup.tip}
      ctaLabel={activePopup.ctaLabel}
      ctaAction={handleCta}
      secondaryLabel={activePopup.secondaryLabel}
      onClose={handleClose}
    />
  );
};

export default FeaturePopupManager;
