import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { users, playlists, sessions } from "../shared/schema";
import { eq } from "drizzle-orm";

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

  const httpServer = createServer(app);

  return httpServer;
}
