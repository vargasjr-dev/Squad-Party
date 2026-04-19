import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { playlists } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/playlists — List all playlists
 * POST /api/playlists — Create a new playlist
 */
export async function GET() {
  const allPlaylists = await db.select().from(playlists);
  return NextResponse.json(allPlaylists);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, games, creatorId } = body;

  if (!name || !creatorId) {
    return NextResponse.json(
      { error: "name and creatorId required" },
      { status: 400 },
    );
  }

  const [playlist] = await db
    .insert(playlists)
    .values({
      id: nanoid(),
      name,
      description: description || "",
      games: games || [],
      creatorId,
    })
    .returning();

  return NextResponse.json(playlist, { status: 201 });
}
