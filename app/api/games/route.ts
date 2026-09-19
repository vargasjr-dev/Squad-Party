import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../lib/auth.server";
import { db } from "../../../server/db";
import { customGames } from "../../../shared/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/games — List the signed-in creator's games.
 * POST /api/games — Create or update a game from the Studio chat.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const games = await db
    .select()
    .from(customGames)
    .where(eq(customGames.creatorId, session.user.id))
    .orderBy(desc(customGames.updatedAt));

  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, name, description, chatHistory } = body;

  if (!Array.isArray(chatHistory)) {
    return NextResponse.json(
      { error: "chatHistory is required" },
      { status: 400 },
    );
  }

  if (gameId) {
    const [existing] = await db
      .select()
      .from(customGames)
      .where(eq(customGames.id, gameId))
      .limit(1);

    if (!existing || existing.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(customGames)
      .set({
        chatHistory,
        metadata: {
          ...existing.metadata,
          name: name ?? existing.metadata.name,
          description: description ?? existing.metadata.description,
        },
        updatedAt: new Date(),
      })
      .where(eq(customGames.id, gameId))
      .returning();

    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(customGames)
    .values({
      id: nanoid(),
      creatorId: session.user.id,
      metadata: {
        name: name?.trim() || "Untitled game",
        description: description?.trim() || "",
        type: "custom",
        duration: 10,
        rules: [],
        version: "0.1.0",
      },
      logicLua: "",
      chatHistory,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
