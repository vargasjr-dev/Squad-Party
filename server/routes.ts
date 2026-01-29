import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, playlists, sessions, customGames, type GameMetadata, type ChatMessage } from "../shared/schema";
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
  // Admin usernames list with initial passwords
  const ADMIN_USERS: Record<string, string> = {
    "vargas": "902495"
  };

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
      
      const [newUser] = await db.insert(users).values({
        id,
        username,
        passwordHash,
        avatarUrl: avatarUrl || null,
        gamesPlayed: 0,
        wins: 0,
        topRank: 0,
        isAdmin,
      }).returning();
      
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
        userId: user.id 
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
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid current password" });
        }
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      const [updatedUser] = await db.update(users)
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
      
      const [updatedUser] = await db.update(users)
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
      const { id, name, description, games, creatorId, isPublic, playCount } = req.body;
      
      const [newPlaylist] = await db.insert(playlists).values({
        id,
        name,
        description,
        games: games || [],
        creatorId,
        isPublic: isPublic || false,
        playCount: playCount || 0,
      }).returning();
      
      res.json(newPlaylist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });
  
  app.put("/api/playlists/:id", async (req: Request, res: Response) => {
    try {
      const { name, description, games, isPublic, playCount } = req.body;
      
      const [updatedPlaylist] = await db.update(playlists)
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
      const [deletedPlaylist] = await db.delete(playlists)
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
      const { id, hostId, hostName, playlistId, playlistName, players, isPublic } = req.body;
      
      const [newSession] = await db.insert(sessions).values({
        id,
        hostId,
        hostName,
        playlistId,
        playlistName,
        players: players || [],
        status: "waiting",
        currentGameIndex: 0,
        isPublic: isPublic || true,
      }).returning();
      
      res.json(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });
  
  app.put("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const { players, status, currentGameIndex } = req.body;
      
      const [updatedSession] = await db.update(sessions)
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
      const [deletedSession] = await db.delete(sessions)
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
            ? and(eq(customGames.creatorId, userId), eq(customGames.isDraft, true))
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
      
      const [newGame] = await db.insert(customGames).values({
        id,
        creatorId,
        playlistId: playlistId || null,
        metadata: DEFAULT_METADATA,
        logicLua: DEFAULT_LOGIC_LUA,
        assets: {},
        chatHistory: [],
        isDraft: true,
        isPublished: false,
      }).returning();
      
      res.json(newGame);
    } catch (error) {
      console.error("Error creating custom game:", error);
      res.status(500).json({ error: "Failed to create custom game" });
    }
  });

  app.put("/api/custom-games/:id", async (req: Request, res: Response) => {
    try {
      const { metadata, logicLua, assets, chatHistory, isDraft, isPublished } = req.body;
      
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (metadata !== undefined) updateData.metadata = metadata;
      if (logicLua !== undefined) updateData.logicLua = logicLua;
      if (assets !== undefined) updateData.assets = assets;
      if (chatHistory !== undefined) updateData.chatHistory = chatHistory;
      if (isDraft !== undefined) updateData.isDraft = isDraft;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      
      const [updatedGame] = await db.update(customGames)
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
      const [deletedGame] = await db.delete(customGames)
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
  app.get("/api/games/:gameId/artifacts", async (req: Request, res: Response) => {
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
  });
  
  // POST save game artifacts - updates metadata.json and/or logic.lua
  app.post("/api/games/:gameId/artifacts", async (req: Request, res: Response) => {
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
      
      const [updatedGame] = await db.update(customGames)
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
  });

  // Vellum Chat endpoint (non-streaming, buffers full response server-side)
  app.post("/api/vellum/chat", async (req: Request, res: Response) => {
    try {
      const { userId, gameId, message } = req.body;
      
      const VELLUM_API_KEY = process.env.VELLUM_API_KEY;
      if (!VELLUM_API_KEY) {
        return res.status(500).json({ error: "Vellum API key not configured" });
      }
      
      const VELLUM_WORKFLOW_ID = process.env.VELLUM_WORKFLOW_ID;
      if (!VELLUM_WORKFLOW_ID) {
        return res.status(500).json({ error: "Vellum workflow ID not configured" });
      }

      console.log(`[Vellum] Calling workflow ${VELLUM_WORKFLOW_ID} for game ${gameId}`);
      
      // Call Vellum execute-workflow endpoint (non-streaming)
      const vellumResponse = await fetch(
        `https://predict.vellum.ai/v1/execute-workflow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": VELLUM_API_KEY,
          },
          body: JSON.stringify({
            workflow_deployment_name: VELLUM_WORKFLOW_ID,
            inputs: [
              { name: "user_id", type: "STRING", value: userId },
              { name: "game_id", type: "STRING", value: gameId },
              { name: "user_message", type: "STRING", value: message },
            ],
          }),
        }
      );
      
      if (!vellumResponse.ok) {
        const errorText = await vellumResponse.text();
        console.error("[Vellum] API error:", errorText);
        return res.status(vellumResponse.status).json({ 
          error: "Vellum API error", 
          details: errorText 
        });
      }
      
      const vellumResult = await vellumResponse.json();
      console.log("[Vellum] Workflow result:", JSON.stringify(vellumResult, null, 2));
      
      const executionId = vellumResult.execution_id || null;
      
      // Check for workflow execution errors
      if (vellumResult.state === "REJECTED" || vellumResult.state === "FAILED") {
        const errorMessage = vellumResult.error?.message || "Workflow execution failed";
        console.error("[Vellum] Workflow failed:", errorMessage);
        return res.status(500).json({ 
          error: `AI workflow failed: ${errorMessage}`,
          executionId,
          state: vellumResult.state
        });
      }
      
      // Extract assistant response from Vellum output
      let assistantContent: string | null = null;
      
      if (vellumResult.data?.outputs) {
        const responseOutput = vellumResult.data.outputs.find(
          (o: { name: string; value?: string }) => o.name === "response"
        );
        if (responseOutput?.value) {
          assistantContent = responseOutput.value;
        }
      }
      
      // If we got no response from the workflow, treat it as an error
      if (!assistantContent) {
        console.error("[Vellum] No response output found in workflow result");
        return res.status(500).json({ 
          error: "AI did not return a response. Please try again.",
          executionId,
          workflowResult: vellumResult
        });
      }
      
      console.log(`[Vellum] Execution ID: ${executionId}`);
      
      // Add assistant message to chat history (with execution ID for admin debugging)
      const game = await db.query.customGames.findFirst({
        where: eq(customGames.id, gameId),
      });
      
      if (game) {
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          executionId: executionId || undefined,
        };
        
        await db.update(customGames)
          .set({
            chatHistory: [...(game.chatHistory || []), assistantMessage],
            updatedAt: new Date(),
          })
          .where(eq(customGames.id, gameId));
      }
      
      res.json({ 
        success: true, 
        response: assistantContent,
        executionId,
        workflowResult: vellumResult 
      });
    } catch (error) {
      console.error("[Vellum] Error executing workflow:", error);
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
