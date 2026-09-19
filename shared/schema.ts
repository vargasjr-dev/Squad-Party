import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  gamesPlayed: integer("games_played").default(0).notNull(),
  wins: integer("wins").default(0).notNull(),
  topRank: integer("top_rank").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── better-auth tables ─────────────────────────────────
// Required by the better-auth drizzle adapter (lib/auth.server.ts).
// The app-level "users" table above is separate game-profile data.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authSession = pgTable("auth_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  games: jsonb("games").$type<string[]>().default([]).notNull(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  playCount: integer("play_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  // Plain text (no FK): guests can host without an account row.
  hostId: text("host_id").notNull(),
  hostName: text("host_name").notNull(),
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlists.id),
  playlistName: text("playlist_name").notNull(),
  players: jsonb("players").$type<SessionPlayer[]>().default([]).notNull(),
  status: text("status")
    .$type<"waiting" | "playing" | "finished">()
    .default("waiting")
    .notNull(),
  currentGameIndex: integer("current_game_index").default(0).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface GameMetadata {
  name: string;
  description: string;
  type: "word" | "trivia" | "speed" | "memory" | "custom";
  duration: number;
  rules: string[];
  version: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  executionId?: string; // Legacy field (previously used for Vellum)
}

export const customGames = pgTable("custom_games", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id),
  playlistId: text("playlist_id").references(() => playlists.id),
  metadata: jsonb("metadata").$type<GameMetadata>().notNull(),
  logicLua: text("logic_lua").notNull(),
  assets: jsonb("assets").$type<Record<string, string>>().default({}).notNull(),
  chatHistory: jsonb("chat_history")
    .$type<ChatMessage[]>()
    .default([])
    .notNull(),
  isDraft: boolean("is_draft").default(true).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface SessionPlayer {
  id: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  isHost: boolean;
  isReady: boolean;
}

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});
export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  createdAt: true,
});
export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});
export const insertCustomGameSchema = createInsertSchema(customGames).omit({
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type CustomGame = typeof customGames.$inferSelect;
export type InsertCustomGame = typeof customGames.$inferInsert;
