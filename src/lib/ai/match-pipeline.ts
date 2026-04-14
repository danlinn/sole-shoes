import { db } from "@/lib/db";
import type { ShoePostModel as ShoePost } from "@/generated/prisma/models";
import { computeMatchScore, type ScoringResult } from "./scoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineResult {
  sourcePostId: string;
  candidatesEvaluated: number;
  suggestionsCreated: number;
  topScore: number | null;
}

interface ScoredCandidate {
  candidate: ShoePost;
  result: ScoringResult;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CANDIDATES = 50;
const MAX_SUGGESTIONS = 5;
const HIGH_SCORE_THRESHOLD = 70;

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full match-suggestion pipeline for a single ShoePost.
 *
 * Stage A – Rules-based candidate filtering (DB query)
 * Stage B – Scoring each candidate
 * Stage C – Build human-readable explanations (done inside scoring)
 * Stage D – Persist top suggestions & create notifications
 */
export async function runMatchPipeline(
  shoePostId: string,
): Promise<PipelineResult> {
  // ---- Fetch the source post ----
  const sourcePost = await db.shoePost.findUnique({
    where: { id: shoePostId },
  });

  if (!sourcePost) {
    throw new Error(`ShoePost not found: ${shoePostId}`);
  }

  // ---- Stage A: candidate filtering ----
  const candidates = await findCandidates(sourcePost);

  if (candidates.length === 0) {
    await markProcessed(shoePostId);
    return {
      sourcePostId: shoePostId,
      candidatesEvaluated: 0,
      suggestionsCreated: 0,
      topScore: null,
    };
  }

  // ---- Stage B + C: score & explain ----
  const scored = scoreCandidates(sourcePost, candidates);

  // ---- Stage D: persist ----
  const suggestionsCreated = await saveSuggestions(
    shoePostId,
    sourcePost.userId,
    scored,
  );

  await markProcessed(shoePostId);

  return {
    sourcePostId: shoePostId,
    candidatesEvaluated: candidates.length,
    suggestionsCreated,
    topScore: scored.length > 0 ? scored[0].result.score : null,
  };
}

// ---------------------------------------------------------------------------
// Stage A – Candidate query
// ---------------------------------------------------------------------------

async function findCandidates(source: ShoePost): Promise<ShoePost[]> {
  const oppositeType = source.type === "LOST" ? "FOUND" : "LOST";
  const oppositeSide = source.side === "LEFT" ? "RIGHT" : "LEFT";

  return db.shoePost.findMany({
    where: {
      id: { not: source.id },
      type: oppositeType,
      side: oppositeSide,
      status: { in: ["OPEN", "POTENTIAL_MATCH"] },
    },
    take: MAX_CANDIDATES,
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Stage B + C – Score candidates and sort
// ---------------------------------------------------------------------------

function scoreCandidates(
  source: ShoePost,
  candidates: ShoePost[],
): ScoredCandidate[] {
  return candidates
    .map((candidate) => ({
      candidate,
      result: computeMatchScore(source, candidate),
    }))
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, MAX_SUGGESTIONS);
}

// ---------------------------------------------------------------------------
// Stage D – Persist suggestions + notifications
// ---------------------------------------------------------------------------

async function saveSuggestions(
  sourcePostId: string,
  sourceUserId: string,
  scored: ScoredCandidate[],
): Promise<number> {
  let created = 0;

  for (const { candidate, result } of scored) {
    // Skip very low scores
    if (result.score <= 0) continue;

    await db.matchSuggestion.upsert({
      where: {
        sourcePostId_candidatePostId: {
          sourcePostId,
          candidatePostId: candidate.id,
        },
      },
      update: {
        score: result.score,
        explanation: result.explanation,
      },
      create: {
        sourcePostId,
        candidatePostId: candidate.id,
        score: result.score,
        explanation: result.explanation,
        status: "SUGGESTED",
      },
    });

    created++;

    // Create notification for high-score matches
    if (result.score >= HIGH_SCORE_THRESHOLD) {
      await createMatchNotification(
        sourceUserId,
        sourcePostId,
        candidate,
        result.score,
      );
    }
  }

  return created;
}

async function createMatchNotification(
  userId: string,
  sourcePostId: string,
  candidate: ShoePost,
  score: number,
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        type: "AI_MATCH_FOUND",
        title: "Potential match found!",
        body: `We found a potential match for your shoe post: ${candidate.brand} ${candidate.model ?? ""} (${candidate.side} ${candidate.type.toLowerCase()}) - ${score}% confidence.`.trim(),
        data: {
          sourcePostId,
          candidatePostId: candidate.id,
          score,
        },
      },
    });

    // Also notify the candidate's owner
    await db.notification.create({
      data: {
        userId: candidate.userId,
        type: "AI_MATCH_FOUND",
        title: "Potential match found!",
        body: `Someone may have the matching shoe for your post: ${candidate.brand} ${candidate.model ?? ""} - ${score}% confidence.`.trim(),
        data: {
          sourcePostId,
          candidatePostId: candidate.id,
          score,
        },
      },
    });
  } catch {
    // Notification failures should not break the pipeline
    console.error(
      `[match-pipeline] Failed to create notification for match ${sourcePostId} <-> ${candidate.id}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function markProcessed(shoePostId: string): Promise<void> {
  await db.shoePost.update({
    where: { id: shoePostId },
    data: { aiProcessedAt: new Date() },
  });
}
