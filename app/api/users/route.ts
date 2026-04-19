import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../server/db";
import { users } from "../../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/users?id=... — Get user by ID
 * POST /api/users — Create a new user (legacy registration)
 *
 * Note: Primary auth is now via better-auth (/api/auth/*).
 * This endpoint exists for backward compatibility with the
 * existing game client and will be consolidated later.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      gamesPlayed: users.gamesPlayed,
      wins: users.wins,
      topRank: users.topRank,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
