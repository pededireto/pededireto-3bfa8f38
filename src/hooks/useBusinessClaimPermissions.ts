import { usePlanRuleByPlanId } from "@/hooks/usePlanRules";
import type { BusinessWithCategory } from "@/hooks/useBusinesses";

interface ClaimPermissions {
  claimStatus: string;
  isPending: boolean;
  isPreview: boolean;
  isVerified: boolean;
  isRejected: boolean;
  isRevoked: boolean;
  isFreePlan: boolean;
  isPaidPlan: boolean;
  canEditBasicFields: boolean;
  canEditAdvancedFields: boolean;
  canViewBasicAnalytics: boolean;
  canViewProAnalytics: boolean;
  canViewRequests: boolean;
  canViewTeam: boolean;
  canViewInsights: boolean;
  bannerMessage: string | null;
  bannerVariant: "warning" | "destructive" | "secondary" | null;
}

export const useBusinessClaimPermissions = (
  business: BusinessWithCategory | null | undefined
): ClaimPermissions => {
  const planId = business?.plan_id ?? null;
  const { data: planRule } = usePlanRuleByPlanId(planId);

  if (!business) {
    return {
      claimStatus: "unclaimed",
      isPending: false,
      isPreview: false,
      isVerified: false,
      isRejected: false,
      isRevoked: false,
      isFreePlan: true,
      isPaidPlan: false,
      canEditBasicFields: false,
      canEditAdvancedFields: false,
      canViewBasicAnalytics: false,
      canViewProAnalytics: false,
      canViewRequests: false,
      canViewTeam: false,
      canViewInsights: false,
      bannerMessage: null,
      bannerVariant: null,
    };
  }

  const claimStatus = (business as any).claim_status || "unclaimed";
  const isPending = claimStatus === "pending";
  const isPreview = claimStatus === "preview";
  const isVerified = claimStatus === "verified";
  const isRejected = claimStatus === "rejected";
  const isRevoked = claimStatus === "revoked";

  const hasPaidSubscription =
    business.subscription_status === "active" &&
    business.subscription_plan !== "free";
  const isPaidPlan = hasPaidSubscription;
  const isFreePlan = !isPaidPlan;

  const allowAnalyticsPro = !!(planRule as any)?.allow_analytics_pro;
  const allowAnalyticsBasic = (planRule as any)?.allow_analytics_basic !== false;

  const canEditBasicFields = isPending || isPreview || isVerified;
  const canEditAdvancedFields = isVerified;
  const canViewBasicAnalytics = (isPreview || isVerified) && allowAnalyticsBasic;
  const canViewProAnalytics = isVerified && allowAnalyticsPro;
  const canViewRequests = isVerified && isPaidPlan;
  const canViewTeam = isVerified;
  const canViewInsights = isVerified && isPaidPlan;

  let bannerMessage: string | null = null;
  let bannerVariant: "warning" | "destructive" | "secondary" | null = null;

  if (isPreview) {
    bannerMessage =
      "O teu negócio está em verificação. Podes explorar o painel — para receber pedidos ativa um plano pago.";
    bannerVariant = "warning";
  } else if (isPending) {
    bannerMessage =
      "O seu pedido está em validação. Aguarde contacto da nossa equipa comercial.";
    bannerVariant = "warning";
  } else if (isRejected) {
    bannerMessage =
      "O seu pedido de claim foi rejeitado. Contacte o suporte para mais informações.";
    bannerVariant = "destructive";
  } else if (isRevoked) {
    bannerMessage = "O acesso a este negócio foi revogado.";
    bannerVariant = "secondary";
  }

  return {
    claimStatus,
    isPending,
    isPreview,
    isVerified,
    isRejected,
    isRevoked,
    isFreePlan,
    isPaidPlan,
    canEditBasicFields,
    canEditAdvancedFields,
    canViewBasicAnalytics,
    canViewProAnalytics,
    canViewRequests,
    canViewTeam,
    canViewInsights,
    bannerMessage,
    bannerVariant,
  };
};
