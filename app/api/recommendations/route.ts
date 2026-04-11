import { NextRequest, NextResponse } from "next/server";
import { GetTrackRecommendations } from "@/lib/recommendations/use-case";
import type { RecommendationRequest } from "@/lib/recommendations/types";

export const runtime = "nodejs";

function isRecommendationRequest(value: unknown): value is RecommendationRequest {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const hasSingleSeed =
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.artist === "string" &&
    candidate.artist.trim().length > 0;
  const hasSeedArray =
    Array.isArray(candidate.seeds) &&
    candidate.seeds.some((seed) => {
      if (typeof seed !== "object" || seed === null) return false;
      const currentSeed = seed as Record<string, unknown>;
      return (
        typeof currentSeed.title === "string" &&
        currentSeed.title.trim().length > 0 &&
        typeof currentSeed.artist === "string" &&
        currentSeed.artist.trim().length > 0
      );
    });

  return (
    hasSingleSeed || hasSeedArray
  );
}

async function parseRequestBody(
  request: NextRequest,
): Promise<RecommendationRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }

  if (!isRecommendationRequest(body)) {
    throw new Error("Body must include non-empty title and artist fields.");
  }

  return body;
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const useCase = new GetTrackRecommendations();
    const result = await useCase.execute(body);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to build recommendations.";
    const isValidationError =
      message === "Request body must be valid JSON." ||
      message === "Body must include non-empty title and artist fields.";

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
