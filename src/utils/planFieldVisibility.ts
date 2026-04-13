/**
 * planFieldVisibility.ts
 *
 * Defines which profile fields are visible per subscription tier.
 * Data is NEVER deleted on downgrade — only visibility changes.
 *
 * Tiers: free | start | pro
 */

export type PlanTier = "free" | "start" | "pro";

/** Minimum tier required for a field to be visible */
const FIELD_MIN_TIER: Record<string, PlanTier> = {
  // ─── Always visible (FREE) ───
  name: "free",
  description: "free",
  logo_url: "free",
  category: "free",
  alcance: "free",
  city: "free",
  public_address: "free",
  cta_phone: "free",
  cta_email: "free",
  cta_website: "free",
  schedule: "free",

  // ─── START tier ───
  cta_whatsapp: "start",
  instagram_url: "start",
  facebook_url: "start",
  other_social_url: "start",
  photo_1: "start",
  photo_2: "start",
  nif: "start",
  address: "start",
  owner_name: "start",
  owner_phone: "start",
  owner_email: "start",
  attendance_type: "start",

  // ─── PRO tier ───
  photo_3: "pro",
  photo_4: "pro",
  photo_5: "pro",
  photo_6: "pro",
  video: "pro",
  promotions: "pro",
};

const TIER_RANK: Record<PlanTier, number> = { free: 0, start: 1, pro: 2 };

/** Check if a specific field is visible for a given tier */
export const isFieldVisible = (fieldKey: string, tier: PlanTier): boolean => {
  const minTier = FIELD_MIN_TIER[fieldKey];
  if (!minTier) return true; // unknown field → show
  return TIER_RANK[tier] >= TIER_RANK[minTier];
};

/** Get the minimum required tier label for a locked field */
export const getRequiredPlanLabel = (fieldKey: string): "START" | "PRO" => {
  const minTier = FIELD_MIN_TIER[fieldKey];
  if (minTier === "pro") return "PRO";
  return "START";
};

/** Get all field keys and their min tier */
export const getAllFieldTiers = () => FIELD_MIN_TIER;

/** Count how many of the 29 profile fields are visible for a given tier */
export const getVisibleFieldCount = (tier: PlanTier): number => {
  return Object.values(FIELD_MIN_TIER).filter(
    (minTier) => TIER_RANK[tier] >= TIER_RANK[minTier]
  ).length;
};

/** List of all 29 profile field keys in order */
export const ALL_PROFILE_FIELD_KEYS = Object.keys(FIELD_MIN_TIER);
