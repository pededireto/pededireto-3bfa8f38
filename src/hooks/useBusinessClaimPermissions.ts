// hooks/useBusinessClaimPermissions.ts
import { useUser } from "./useUser";
import { useBusiness } from "./useBusiness";

type ClaimStatus = "none" | "unclaimed" | "preview" | "pending" | "verified" | "rejected" | "revoked";

interface BusinessPermissions {
  // Estados
  isUnclaimed: boolean;
  isPreview: boolean;
  isPending: boolean;
  isVerified: boolean;
  isRejected: boolean;
  isRevoked: boolean;

  // Permissões de visualização
  canViewDashboard: boolean;
  canViewBasicAnalytics: boolean; // ← NOVO: Preview vê isto
  canViewRequests: boolean; // ← Bloqueado em Preview
  canViewInsights: boolean; // ← Bloqueado em Preview
  canViewConversations: boolean; // ← Bloqueado em Preview
  canEditBusiness: boolean;
  canManageTeam: boolean;
  canManagePlan: boolean;

  // Permissões de ação
  canAcceptRequests: boolean;
  canRespondToMessages: boolean;
  canUpgradePlan: boolean; // ← Sempre true em Preview

  // Helpers UI
  showUpgradeBanner: boolean; // ← NOVO: Controla banner CTA
  upgradeMessage: string; // ← NOVO: Mensagem contextual
}

export function useBusinessClaimPermissions(businessId: string): BusinessPermissions {
  const { user } = useUser();
  const { business, businessUser } = useBusiness(businessId);

  const claimStatus = (business?.claim_status as ClaimStatus) || "none";
  const userRole = businessUser?.role;

  // Estados derivados
  const isUnclaimed = claimStatus === "unclaimed" || claimStatus === "none";
  const isPreview = claimStatus === "preview";
  const isPending = claimStatus === "pending";
  const isVerified = claimStatus === "verified";
  const isRejected = claimStatus === "rejected";
  const isRevoked = claimStatus === "revoked";

  // Qualquer estado "reivindicado" vê alguma coisa
  const isClaimed = isPreview || isPending || isVerified || isRejected;

  // Permissões de visualização
  const canViewDashboard = isClaimed;
  const canViewBasicAnalytics = isPreview || isVerified; // Preview vê básico
  const canViewRequests = isVerified; // Só verified vê pedidos
  const canViewInsights = isVerified; // Só verified vê insights
  const canViewConversations = isVerified;

  // Edição só verified
  const canEditBusiness = isVerified;
  const canManageTeam = isVerified;
  const canManagePlan = isVerified || isPreview; // Preview pode ver planos

  // Ações
  const canAcceptRequests = isVerified;
  const canRespondToMessages = isVerified;
  const canUpgradePlan = isPreview || isVerified;

  // Banner CTA contextual
  const showUpgradeBanner = isPreview;
  const upgradeMessage = isPreview
    ? "🚀 Está em modo Preview! Valide o seu negócio para desbloquear pedidos de orçamento e chat com clientes."
    : "";

  return {
    isUnclaimed,
    isPreview,
    isPending,
    isVerified,
    isRejected,
    isRevoked,

    canViewDashboard,
    canViewBasicAnalytics,
    canViewRequests,
    canViewInsights,
    canViewConversations,
    canEditBusiness,
    canManageTeam,
    canManagePlan,

    canAcceptRequests,
    canRespondToMessages,
    canUpgradePlan,

    showUpgradeBanner,
    upgradeMessage,
  };
}
