import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { users, playlists, sessions, customGames, type GameMetadata, type ChatMessage } from "../shared/schema";
import { eq } from "drizzle-orm";

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
      
      const [newUser] = await db.insert(users).values({
        id,
        username,
        avatarUrl: avatarUrl || null,
        gamesPlayed: 0,
        wins: 0,
        topRank: 0,
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
      
      if (userId) {
        const userGames = await db.query.customGames.findMany({
          where: eq(customGames.creatorId, userId),
        });
        return res.json(userGames);
      }
      
      const allGames = await db.query.customGames.findMany();
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
      const { metadata, logicLua, assets, chatHistory, isPublished } = req.body;
      
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (metadata !== undefined) updateData.metadata = metadata;
      if (logicLua !== undefined) updateData.logicLua = logicLua;
      if (assets !== undefined) updateData.assets = assets;
      if (chatHistory !== undefined) updateData.chatHistory = chatHistory;
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

  // Vellum Workflow Proxy (for secure API key handling)
  app.post("/api/vellum/execute", async (req: Request, res: Response) => {
    try {
      const { userId, gameId, message } = req.body;
      
      const VELLUM_API_KEY = process.env.VELLUM_API_KEY;
      if (!VELLUM_API_KEY) {
        return res.status(500).json({ error: "Vellum API key not configured" });
      }
      
      const VELLUM_WORKFLOW_ID = process.env.VELLUM_WORKFLOW_ID || "game-studio-workflow";
      
      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      // Call Vellum execute-stream endpoint
      const vellumResponse = await fetch(
        `https://api.vellum.ai/v1/execute-workflow-stream`,
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
        console.error("Vellum API error:", errorText);
        res.write(`data: ${JSON.stringify({ error: "Vellum API error", details: errorText })}\n\n`);
        res.end();
        return;
      }
      
      // Stream the response back to client
      const reader = vellumResponse.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`);
        res.end();
        return;
      }
      
      const decoder = new TextDecoder();
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        res.write(chunk);
      }
      
      // After streaming completes, update the game's chat history
      const game = await db.query.customGames.findFirst({
        where: eq(customGames.id, gameId),
      });
      
      if (game) {
        const newUserMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: "user",
          content: message,
          timestamp: Date.now(),
        };
        
        // Parse the final response from Vellum (extract assistant message)
        let assistantContent = "I've updated your game. Please check the preview.";
        try {
          const lines = fullResponse.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.type === "WORKFLOW.EXECUTION.FULFILLED" && data.data?.outputs) {
                const outputMsg = data.data.outputs.find((o: { name: string }) => o.name === "response");
                if (outputMsg?.value) {
                  assistantContent = outputMsg.value;
                }
              }
            }
          }
        } catch {
          // Use default message if parsing fails
        }
        
        const newAssistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
        };
        
        await db.update(customGames)
          .set({
            chatHistory: [...(game.chatHistory || []), newUserMessage, newAssistantMessage],
            updatedAt: new Date(),
          })
          .where(eq(customGames.id, gameId));
      }
      
      res.end();
    } catch (error) {
      console.error("Error executing Vellum workflow:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to execute workflow" })}\n\n`);
      res.end();
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
