import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { sessions } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/sessions — List active game sessions
 * POST /api/sessions — Create a new game session
 */
export async function GET() {
  const allSessions = await db.select().from(sessions);
  return NextResponse.json(allSessions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { hostId, playlistId, code } = body;

  if (!hostId) {
    return NextResponse.json(
      { error: "hostId required" },
      { status: 400 },
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({
      id: nanoid(),
      hostId,
      playlistId: playlistId || null,
      code: code || nanoid(6).toUpperCase(),
      status: "waiting",
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
