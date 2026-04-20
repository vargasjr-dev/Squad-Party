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
  const { hostId, hostName, playlistId, playlistName } = body;

  if (!hostId || !playlistId || !playlistName || !hostName) {
    return NextResponse.json(
      { error: "hostId, hostName, playlistId, and playlistName are required" },
      { status: 400 },
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({
      id: nanoid(),
      hostId,
      hostName,
      playlistId,
      playlistName,
      status: "waiting",
    })
    .returning();

  return NextResponse.json(session, { status: 201 });
}
