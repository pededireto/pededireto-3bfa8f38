/**
 * Lógica centralizada de estado de activação de um negócio.
 *
 * INACTIVO           — is_active = false (desactivado manualmente)
 * ACTIVO NÃO RECLAMADO — is_active = true AND claim_status NOT 'claimed'/'verified'
 * ACTIVO              — is_active = true AND claim_status = 'claimed' ou 'verified'
 *
 * O plano de subscrição (free / start / pro) é independente deste estado.
 */

export type BusinessActivationStatus = "inactive" | "active_unclaimed" | "active";

export interface BusinessStatusInput {
  is_active: boolean;
  claim_status?: string | null;
}

const CLAIMED_STATUSES = new Set(["claimed", "verified"]);

export function getBusinessActivationStatus(b: BusinessStatusInput): BusinessActivationStatus {
  if (!b.is_active) return "inactive";
  if (CLAIMED_STATUSES.has(b.claim_status ?? "")) return "active";
  return "active_unclaimed";
}

export function getBusinessStatusLabel(b: BusinessStatusInput): string {
  const s = getBusinessActivationStatus(b);
  switch (s) {
    case "inactive":
      return "Inactivo";
    case "active_unclaimed":
      return "Activo Não Reclamado";
    case "active":
      return "Activo";
  }
}

export function getBusinessStatusVariant(b: BusinessStatusInput): "default" | "secondary" | "outline" {
  const s = getBusinessActivationStatus(b);
  switch (s) {
    case "active":
      return "default";
    case "active_unclaimed":
      return "outline";
    case "inactive":
      return "secondary";
  }
}

export function getBusinessStatusEmoji(b: BusinessStatusInput): string {
  const s = getBusinessActivationStatus(b);
  switch (s) {
    case "active":
      return "✅";
    case "active_unclaimed":
      return "🟡";
    case "inactive":
      return "⚠️";
  }
}
