const LEGACY_MATCH_STATUS_MAP = {
  accepted: "aceite",
  rejected: "recusado",
  expired: "expirado",
  no_response: "sem_resposta",
} as const;

export const normalizeMatchStatus = (status: string) => {
  return LEGACY_MATCH_STATUS_MAP[status as keyof typeof LEGACY_MATCH_STATUS_MAP] ?? status;
};