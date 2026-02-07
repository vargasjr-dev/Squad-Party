import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcryptjs";
import { db } from "./db";
import {
  users,
  playlists,
  sessions,
  customGames,
  type GameMetadata,
  type ChatMessage,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_METADATA: GameMetadata = {
  name: "New Game",
  description: "A custom mini-game",
  type: "custom",
  duration: 60,
  rules: ["Tap to play", "Score points before time runs out"],
  version: "1.0.0",
};

const DEFAULT_LOGIC_LUA = `-- Squad Party Game Logic
-- This Lua script controls your game behavior

local Game = {}

-- Initialize game state
function Game.init()
  return {
    score = 0,
    timeRemaining = 60,
    currentWord = "",
    isPlaying = false,
  }
end

-- Called when game starts
function Game.start(state)
  state.isPlaying = true
  state.currentWord = Game.getRandomWord()
  return state
end

-- Get a random word for the player
function Game.getRandomWord()
  local words = {"PARTY", "SQUAD", "GAME", "PLAY", "WIN", "SCORE", "FUN"}
  return words[math.random(#words)]
end

-- Process player input
function Game.onInput(state, input)
  if input == state.currentWord then
    state.score = state.score + 10
    state.currentWord = Game.getRandomWord()
  end
  return state
end

-- Called every tick (for timer updates)
function Game.tick(state, deltaTime)
  if state.isPlaying then
    state.timeRemaining = state.timeRemaining - deltaTime
    if state.timeRemaining <= 0 then
      state.isPlaying = false
    end
  end
  return state
end

-- Get final results
function Game.getResults(state)
  return {
    score = state.score,
    wordsCompleted = math.floor(state.score / 10),
  }
end

return Game
`;

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin configuration from environment variables
  // Format: ADMIN_USERS="username1:password1,username2:password2"
  const ADMIN_USERS: Record<string, string> = {};
  const adminUsersEnv = process.env.ADMIN_USERS;
  if (adminUsersEnv) {
    for (const entry of adminUsersEnv.split(",")) {
      const [username, password] = entry.split(":").map((s) => s.trim());
      if (username && password) {
        ADMIN_USERS[username.toLowerCase()] = password;
      }
    }
  }

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const { id, username, avatarUrl } = req.body;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (existingUser) {
        return res.json(existingUser);
      }

      // Check if username is taken
      const userWithUsername = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (userWithUsername) {
        return res.json(userWithUsername);
      }

      // Auto-grant admin for specific usernames and set initial password
      const lowerUsername = username.toLowerCase();
      const isAdmin = lowerUsername in ADMIN_USERS;
      let passwordHash = null;

      if (isAdmin && ADMIN_USERS[lowerUsername]) {
        passwordHash = await bcrypt.hash(ADMIN_USERS[lowerUsername], 10);
      }

      const [newUser] = await db
        .insert(users)
        .values({
          id,
          username,
          passwordHash,
          avatarUrl: avatarUrl || null,
          gamesPlayed: 0,
          wins: 0,
          topRank: 0,
          isAdmin,
        })
        .returning();

      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.params.id),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Check if username has password protection
  app.get("/api/auth/check/:username", async (req: Request, res: Response) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.username, req.params.username),
      });

      if (!user) {
        return res.json({ exists: false, hasPassword: false });
      }

      res.json({
        exists: true,
        hasPassword: !!user.passwordHash,
        userId: user.id,
      });
    } catch (error) {
      console.error("Error checking user:", error);
      res.status(500).json({ error: "Failed to check user" });
    }
  });

  // Login with password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.passwordHash) {
        return res.status(400).json({ error: "User has no password set" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Return user without passwordHash
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Set or change password
  app.post("/api/users/:id/password", async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.params.id),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user has existing password, verify current password
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password required" });
        }
        const isValid = await bcrypt.compare(
          currentPassword,
          user.passwordHash,
        );
        if (!isValid) {
          return res.status(401).json({ error: "Invalid current password" });
        }
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      const [updatedUser] = await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, req.params.id))
        .returning();

      // Return user without passwordHash
      const { passwordHash: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error setting password:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { username, avatarUrl, gamesPlayed, wins, topRank } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({ username, avatarUrl, gamesPlayed, wins, topRank })
        .where(eq(users.id, req.params.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Playlist routes
  app.get("/api/playlists", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (userId) {
        const userPlaylists = await db.query.playlists.findMany({
          where: eq(playlists.creatorId, userId),
        });
        return res.json(userPlaylists);
      }

      const allPlaylists = await db.query.playlists.findMany();
      res.json(allPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", async (req: Request, res: Response) => {
    try {
      const { id, name, description, games, creatorId, isPublic, playCount } =
        req.body;

      const [newPlaylist] = await db
        .insert(playlists)
        .values({
          id,
          name,
          description,
          games: games || [],
          creatorId,
          isPublic: isPublic || false,
          playCount: playCount || 0,
        })
        .returning();

      res.json(newPlaylist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  app.put("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const { name, description, games, isPublic, playCount } = req.body;

      const [updatedPlaylist] = await db
        .update(playlists)
        .set({ name, description, games, isPublic, playCount })
        .where(eq(playlists.id, req.params.id))
        .returning();

      if (!updatedPlaylist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      res.json(updatedPlaylist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const [deletedPlaylist] = await db
        .delete(playlists)
        .where(eq(playlists.id, req.params.id))
        .returning();

      if (!deletedPlaylist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // Session routes
  app.get("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const allSessions = await db.query.sessions.findMany({
        where: eq(sessions.status, "waiting"),
      });
      res.json(allSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const {
        id,
        hostId,
        hostName,
        playlistId,
        playlistName,
        players,
        isPublic,
      } = req.body;

      const [newSession] = await db
        .insert(sessions)
        .values({
          id,
          hostId,
          hostName,
          playlistId,
          playlistName,
          players: players || [],
          status: "waiting",
          currentGameIndex: 0,
          isPublic: isPublic || true,
        })
        .returning();

      res.json(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const { players, status, currentGameIndex } = req.body;

      const [updatedSession] = await db
        .update(sessions)
        .set({ players, status, currentGameIndex })
        .where(eq(sessions.id, req.params.id))
        .returning();

      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const [deletedSession] = await db
        .delete(sessions)
        .where(eq(sessions.id, req.params.id))
        .returning();

      if (!deletedSession) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Custom Games routes
  app.get("/api/custom-games", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const draftsOnly = req.query.drafts === "true";

      if (userId) {
        const userGames = await db.query.customGames.findMany({
          where: draftsOnly
            ? and(
                eq(customGames.creatorId, userId),
                eq(customGames.isDraft, true),
              )
            : eq(customGames.creatorId, userId),
          orderBy: (games, { desc }) => [desc(games.updatedAt)],
        });
        return res.json(userGames);
      }

      const allGames = await db.query.customGames.findMany({
        orderBy: (games, { desc }) => [desc(games.updatedAt)],
      });
      res.json(allGames);
    } catch (error) {
      console.error("Error fetching custom games:", error);
      res.status(500).json({ error: "Failed to fetch custom games" });
    }
  });

  app.get("/api/custom-games/:id", async (req: Request, res: Response) => {
    try {
      const game = await db.query.customGames.findFirst({
        where: eq(customGames.id, req.params.id),
      });

      if (!game) {
        return res.status(404).json({ error: "Custom game not found" });
      }

      res.json(game);
    } catch (error) {
      console.error("Error fetching custom game:", error);
      res.status(500).json({ error: "Failed to fetch custom game" });
    }
  });

  app.post("/api/custom-games", async (req: Request, res: Response) => {
    try {
      const { id, creatorId, playlistId } = req.body;

      const [newGame] = await db
        .insert(customGames)
        .values({
          id,
          creatorId,
          playlistId: playlistId || null,
          metadata: DEFAULT_METADATA,
          logicLua: DEFAULT_LOGIC_LUA,
          assets: {},
          chatHistory: [],
          isDraft: true,
          isPublished: false,
        })
        .returning();

      res.json(newGame);
    } catch (error) {
      console.error("Error creating custom game:", error);
      res.status(500).json({ error: "Failed to create custom game" });
    }
  });

  app.put("/api/custom-games/:id", async (req: Request, res: Response) => {
    try {
      const { metadata, logicLua, assets, chatHistory, isDraft, isPublished } =
        req.body;

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (metadata !== undefined) updateData.metadata = metadata;
      if (logicLua !== undefined) updateData.logicLua = logicLua;
      if (assets !== undefined) updateData.assets = assets;
      if (chatHistory !== undefined) updateData.chatHistory = chatHistory;
      if (isDraft !== undefined) updateData.isDraft = isDraft;
      if (isPublished !== undefined) updateData.isPublished = isPublished;

      const [updatedGame] = await db
        .update(customGames)
        .set(updateData)
        .where(eq(customGames.id, req.params.id))
        .returning();

      if (!updatedGame) {
        return res.status(404).json({ error: "Custom game not found" });
      }

      res.json(updatedGame);
    } catch (error) {
      console.error("Error updating custom game:", error);
      res.status(500).json({ error: "Failed to update custom game" });
    }
  });

  app.delete("/api/custom-games/:id", async (req: Request, res: Response) => {
    try {
      const [deletedGame] = await db
        .delete(customGames)
        .where(eq(customGames.id, req.params.id))
        .returning();

      if (!deletedGame) {
        return res.status(404).json({ error: "Custom game not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom game:", error);
      res.status(500).json({ error: "Failed to delete custom game" });
    }
  });

  // Game Artifacts API (for Vellum agent to fetch/save game files)

  // GET game artifacts - returns metadata.json and logic.lua
  app.get(
    "/api/games/:gameId/artifacts",
    async (req: Request, res: Response) => {
      try {
        const { gameId } = req.params;

        const game = await db.query.customGames.findFirst({
          where: eq(customGames.id, gameId),
        });

        if (!game) {
          return res.status(404).json({ error: "Game not found" });
        }

        res.json({
          gameId: game.id,
          metadata: game.metadata,
          logicLua: game.logicLua,
          assets: game.assets,
        });
      } catch (error) {
        console.error("Error fetching game artifacts:", error);
        res.status(500).json({ error: "Failed to fetch game artifacts" });
      }
    },
  );

  // POST save game artifacts - updates metadata.json and/or logic.lua
  app.post(
    "/api/games/:gameId/artifacts",
    async (req: Request, res: Response) => {
      try {
        const { gameId } = req.params;
        const { metadata, logicLua, assets } = req.body;

        const game = await db.query.customGames.findFirst({
          where: eq(customGames.id, gameId),
        });

        if (!game) {
          return res.status(404).json({ error: "Game not found" });
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (metadata !== undefined) updateData.metadata = metadata;
        if (logicLua !== undefined) updateData.logicLua = logicLua;
        if (assets !== undefined) updateData.assets = assets;

        const [updatedGame] = await db
          .update(customGames)
          .set(updateData)
          .where(eq(customGames.id, gameId))
          .returning();

        res.json({
          success: true,
          gameId: updatedGame.id,
          metadata: updatedGame.metadata,
          logicLua: updatedGame.logicLua,
          assets: updatedGame.assets,
        });
      } catch (error) {
        console.error("Error saving game artifacts:", error);
        res.status(500).json({ error: "Failed to save game artifacts" });
      }
    },
  );

  // Claude Chat endpoint for Game Studio (replaces Vellum)
  const GAME_STUDIO_SYSTEM_PROMPT = `You are an AI game development assistant for Squad Party, a mobile party game app. You help users create custom mini-games using Lua scripting.

## Your Capabilities
- Help design game mechanics and rules
- Write and modify Lua game logic
- Update game metadata (name, description, rules, duration)
- Suggest improvements and debug issues

## Game Structure
Each game has:
1. **metadata.json**: Game info (name, description, type, duration, rules)
2. **logic.lua**: Lua script controlling game behavior

## Lua API Available
- Game.init() - Initialize game state
- Game.update(dt) - Called every frame with delta time
- Game.onInput(playerId, action, data) - Handle player input
- Game.getState() - Return current game state for UI
- Game.isComplete() - Return true when game should end
- Game.getResults() - Return final scores/rankings

## Response Format
When you need to update game files, include them in your response using these markers:

\`\`\`metadata
{
  "name": "Game Name",
  "description": "Description",
  "type": "custom",
  "duration": 60,
  "rules": ["Rule 1", "Rule 2"],
  "version": "1.0.0"
}
\`\`\`

\`\`\`lua
-- Your Lua code here
\`\`\`

Only include file blocks when you're actually changing them. Always explain what you're doing in plain text too.`;

  // Helper to extract code blocks from Claude's response
  function extractCodeBlocks(content: string): {
    metadata?: GameMetadata;
    logicLua?: string;
    cleanContent: string;
  } {
    let metadata: GameMetadata | undefined;
    let logicLua: string | undefined;
    let cleanContent = content;

    // Extract metadata block
    const metadataMatch = content.match(/```metadata\s*\n([\s\S]*?)\n```/);
    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
        cleanContent = cleanContent.replace(metadataMatch[0], "").trim();
      } catch (e) {
        console.error("[Claude] Failed to parse metadata JSON:", e);
      }
    }

    // Extract lua block
    const luaMatch = content.match(/```lua\s*\n([\s\S]*?)\n```/);
    if (luaMatch) {
      logicLua = luaMatch[1];
      cleanContent = cleanContent.replace(luaMatch[0], "").trim();
    }

    return { metadata, logicLua, cleanContent };
  }

  // Claude Chat endpoint (also supports legacy /api/vellum/chat path)
  const handleClaudeChat = async (req: Request, res: Response) => {
    try {
      const { userId, gameId, message } = req.body;

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      if (!ANTHROPIC_API_KEY) {
        return res
          .status(500)
          .json({ error: "Anthropic API key not configured" });
      }

      // Fetch game context
      const game = await db.query.customGames.findFirst({
        where: eq(customGames.id, gameId),
      });

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      console.log(`[Claude] Processing chat for game ${gameId}`);

      // Build messages array with chat history
      const messages: Array<{ role: "user" | "assistant"; content: string }> =
        [];

      // Add chat history
      for (const msg of game.chatHistory || []) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Add current user message
      messages.push({
        role: "user",
        content: message,
      });

      // Build context about current game state
      const gameContext = `
## Current Game State

**Game ID:** ${gameId}

**metadata.json:**
\`\`\`json
${JSON.stringify(game.metadata, null, 2)}
\`\`\`

**logic.lua:**
\`\`\`lua
${game.logicLua}
\`\`\`

**Assets:** ${Object.keys(game.assets || {}).length > 0 ? JSON.stringify(game.assets) : "None"}

---

User message: ${message}`;

      // Replace the last user message with the enriched context
      messages[messages.length - 1].content = gameContext;

      // Call Claude API
      const claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: GAME_STUDIO_SYSTEM_PROMPT,
            messages: messages,
          }),
        },
      );

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error("[Claude] API error:", errorText);
        return res.status(claudeResponse.status).json({
          error: "Claude API error",
          details: errorText,
        });
      }

      const claudeResult = await claudeResponse.json();
      const assistantContent =
        claudeResult.content?.[0]?.text || "No response generated";

      console.log(
        `[Claude] Response received, ${assistantContent.length} chars`,
      );

      // Extract any code blocks and update game files
      const { metadata, logicLua, cleanContent } =
        extractCodeBlocks(assistantContent);

      // Update game files if Claude provided new versions
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (metadata) {
        updateData.metadata = metadata;
        console.log("[Claude] Updating game metadata");
      }
      if (logicLua) {
        updateData.logicLua = logicLua;
        console.log("[Claude] Updating game logic.lua");
      }

      // Add assistant message to chat history
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      };

      updateData.chatHistory = [...(game.chatHistory || []), assistantMessage];

      await db
        .update(customGames)
        .set(updateData)
        .where(eq(customGames.id, gameId));

      res.json({
        success: true,
        response: assistantContent,
        filesUpdated: {
          metadata: !!metadata,
          logicLua: !!logicLua,
        },
      });
    } catch (error) {
      console.error("[Claude] Error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  };

  // Register both endpoints (new and legacy)
  app.post("/api/claude/chat", handleClaudeChat);
  app.post("/api/vellum/chat", handleClaudeChat); // Legacy support

  const httpServer = createServer(app);

  return httpServer;
}
