import type {
  ShoeCategory,
  PostType,
  ShoeSide,
} from "@/generated/prisma/enums";
import type { ShoePostModel as ShoePost } from "@/generated/prisma/models";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoringResult {
  score: number;
  explanation: string;
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  label: string;
  points: number;
}

/**
 * Minimal subset of ShoePost fields needed for scoring.
 * Keeps the scoring logic decoupled from the full Prisma model so it is
 * easy to test with plain objects.
 */
export type ScoringCandidate = Pick<
  ShoePost,
  | "id"
  | "type"
  | "side"
  | "brand"
  | "model"
  | "category"
  | "size"
  | "primaryColor"
  | "locationText"
>;

// ---------------------------------------------------------------------------
// Size helpers
// ---------------------------------------------------------------------------

/**
 * Parse a shoe size string into a number. Returns null when the string is not
 * a recognisable numeric size (e.g. "one-size", "N/A").
 */
export function parseSize(raw: string): number | null {
  const trimmed = raw.trim();
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/**
 * Two sizes are "compatible" when they are within 1 full size of each other.
 * If either size cannot be parsed the check returns false (unknown = no match).
 */
export function sizesAreCompatible(size1: string, size2: string): boolean {
  const a = parseSize(size1);
  const b = parseSize(size2);
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= 1;
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function stringsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.length > 0 && nb.length > 0 && na === nb;
}

/**
 * Partial location match -- true when either location text contains the other,
 * or they share a significant word (length >= 4) after lowercasing.
 */
export function locationsOverlap(
  loc1: string | null | undefined,
  loc2: string | null | undefined,
): boolean {
  const a = normalize(loc1);
  const b = normalize(loc2);
  if (a.length === 0 || b.length === 0) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length >= 4));
  const wordsB = b.split(/\s+/).filter((w) => w.length >= 4);
  return wordsB.some((w) => wordsA.has(w));
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

/** Groups of categories that are "similar enough" to not penalise. */
const SIMILAR_CATEGORIES: ShoeCategory[][] = [
  ["SNEAKER", "ATHLETIC"],
  ["LOAFER", "DRESS_SHOE"],
  ["SANDAL", "SLIPPER"],
];

export function categoriesAreSimilar(
  a: ShoeCategory,
  b: ShoeCategory,
): boolean {
  if (a === b) return true;
  return SIMILAR_CATEGORIES.some(
    (group) => group.includes(a) && group.includes(b),
  );
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

/**
 * Pure function that computes a match score (0-100) between a source post and
 * a candidate post. Does not access the database.
 */
export function computeMatchScore(
  source: ScoringCandidate,
  candidate: ScoringCandidate,
): ScoringResult {
  const factors: ScoringFactor[] = [];

  // --- Opposite type (LOST <-> FOUND) ---
  const oppositeType =
    (source.type === "LOST" && candidate.type === "FOUND") ||
    (source.type === "FOUND" && candidate.type === "LOST");
  if (oppositeType) {
    factors.push({ label: "Opposite type (lost/found)", points: 20 });
  }

  // --- Side matching ---
  const oppositeSide =
    (source.side === "LEFT" && candidate.side === "RIGHT") ||
    (source.side === "RIGHT" && candidate.side === "LEFT");
  if (oppositeSide) {
    factors.push({ label: "Opposite side (L/R pair)", points: 25 });
  } else if (source.side === candidate.side) {
    factors.push({ label: "Same side (penalty)", points: -30 });
  }

  // --- Brand ---
  if (stringsMatch(source.brand, candidate.brand)) {
    factors.push({ label: `Same brand (${source.brand})`, points: 15 });
  }

  // --- Model ---
  if (stringsMatch(source.model, candidate.model)) {
    factors.push({ label: `Same model (${source.model})`, points: 10 });
  }

  // --- Category ---
  if (source.category === candidate.category) {
    factors.push({ label: `Same category (${source.category})`, points: 10 });
  } else if (categoriesAreSimilar(source.category, candidate.category)) {
    factors.push({
      label: `Similar category (${source.category}/${candidate.category})`,
      points: 5,
    });
  } else {
    factors.push({
      label: `Different category (${source.category} vs ${candidate.category})`,
      points: -10,
    });
  }

  // --- Primary colour ---
  if (stringsMatch(source.primaryColor, candidate.primaryColor)) {
    factors.push({
      label: `Same color (${source.primaryColor})`,
      points: 10,
    });
  }

  // --- Size ---
  if (sizesAreCompatible(source.size, candidate.size)) {
    factors.push({
      label: `Compatible size (${source.size} / ${candidate.size})`,
      points: 5,
    });
  }

  // --- Location ---
  if (locationsOverlap(source.locationText, candidate.locationText)) {
    factors.push({ label: "Similar location", points: 5 });
  }

  // --- Aggregate ---
  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  const explanation = buildExplanation(factors, score);

  return { score, explanation, factors };
}

// ---------------------------------------------------------------------------
// Explanation builder
// ---------------------------------------------------------------------------

function buildExplanation(factors: ScoringFactor[], score: number): string {
  const positives = factors
    .filter((f) => f.points > 0)
    .map((f) => f.label);

  if (positives.length === 0) {
    return `Low match (score ${score}): no strong matching attributes found.`;
  }

  return `Match score ${score}: ${positives.join(", ")}.`;
}
