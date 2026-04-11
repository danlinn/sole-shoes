import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runMatchPipeline } from "@/lib/ai/match-pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shoePostId } = body as { shoePostId?: string };

    if (!shoePostId || typeof shoePostId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid shoePostId" },
        { status: 400 },
      );
    }

    // Validate the post exists
    const post = await db.shoePost.findUnique({
      where: { id: shoePostId },
      select: { id: true, status: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "ShoePost not found" },
        { status: 404 },
      );
    }

    const result = await runMatchPipeline(shoePostId);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[api/ai/process] Pipeline error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
