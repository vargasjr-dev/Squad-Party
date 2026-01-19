import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

export interface MiniGame {
  id: string;
  name: string;
  description: string;
  type: "word" | "trivia" | "speed" | "memory";
  duration: number;
  isDefault: boolean;
  creatorId: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  games: string[];
  creatorId: string;
  isPublic: boolean;
  playCount: number;
}

export interface Session {
  id: string;
  hostId: string;
  hostName: string;
  playlistId: string;
  playlistName: string;
  players: SessionPlayer[];
  status: "waiting" | "playing" | "finished";
  currentGameIndex: number;
  isPublic: boolean;
}

export interface SessionPlayer {
  id: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  isHost: boolean;
  isReady: boolean;
}

interface HostInfo {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface GameContextType {
  miniGames: MiniGame[];
  playlists: Playlist[];
  sessions: Session[];
  currentSession: Session | null;
  createPlaylist: (name: string, description: string, gameIds: string[], creatorId: string) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  createSession: (playlistId: string, isPublic: boolean, host: HostInfo) => Promise<Session>;
  joinSession: (sessionId: string, player: SessionPlayer) => Promise<void>;
  leaveSession: () => Promise<void>;
  startGame: () => Promise<void>;
  endGame: (results: { playerId: string; score: number }[]) => Promise<void>;
  refreshSessions: () => Promise<void>;
  loadPlaylists: (userId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const PLAYLISTS_KEY = "@squad_party_playlists";
const SESSIONS_KEY = "@squad_party_sessions";

const DEFAULT_GAMES: MiniGame[] = [
  {
    id: "word_scramble",
    name: "Word Scramble",
    description: "Unscramble letters to form words as fast as you can!",
    type: "word",
    duration: 60,
    isDefault: true,
    creatorId: null,
  },
  {
    id: "speed_typing",
    name: "Speed Typing",
    description: "Type the words that appear on screen before time runs out!",
    type: "speed",
    duration: 45,
    isDefault: true,
    creatorId: null,
  },
  {
    id: "word_chain",
    name: "Word Chain",
    description: "Create words starting with the last letter of the previous word!",
    type: "word",
    duration: 60,
    isDefault: true,
    creatorId: null,
  },
  {
    id: "trivia_blast",
    name: "Trivia Blast",
    description: "Answer trivia questions faster than your opponents!",
    type: "trivia",
    duration: 30,
    isDefault: true,
    creatorId: null,
  },
  {
    id: "memory_match",
    name: "Memory Match",
    description: "Match pairs of cards before anyone else!",
    type: "memory",
    duration: 45,
    isDefault: true,
    creatorId: null,
  },
  {
    id: "anagram_hunt",
    name: "Anagram Hunt",
    description: "Find all anagrams hidden in the scrambled letters!",
    type: "word",
    duration: 60,
    isDefault: true,
    creatorId: null,
  },
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [miniGames] = useState<MiniGame[]>(DEFAULT_GAMES);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const loadPlaylists = async (userId: string) => {
    try {
      const res = await apiRequest("GET", `/api/playlists?userId=${userId}`);
      const serverPlaylists = await res.json();
      setPlaylists(serverPlaylists);
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(serverPlaylists));
    } catch (error) {
      console.log("Could not load playlists from server, using local:", error);
      const stored = await AsyncStorage.getItem(PLAYLISTS_KEY);
      if (stored) setPlaylists(JSON.parse(stored));
    }
  };

  const loadSessions = async () => {
    try {
      const res = await apiRequest("GET", "/api/sessions");
      const serverSessions = await res.json();
      setSessions(serverSessions);
    } catch (error) {
      console.log("Could not load sessions from server:", error);
      const stored = await AsyncStorage.getItem(SESSIONS_KEY);
      if (stored) setSessions(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createPlaylist = async (name: string, description: string, gameIds: string[], creatorId: string) => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      games: gameIds,
      creatorId,
      isPublic: false,
      playCount: 0,
    };
    
    try {
      const res = await apiRequest("POST", "/api/playlists", newPlaylist);
      const serverPlaylist = await res.json();
      const updated = [...playlists, serverPlaylist];
      setPlaylists(updated);
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      return serverPlaylist;
    } catch (error) {
      console.error("Failed to sync playlist to server:", error);
      const updated = [...playlists, newPlaylist];
      setPlaylists(updated);
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      return newPlaylist;
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return;
    
    const updatedPlaylist = { ...playlist, ...updates };
    
    try {
      await apiRequest("PUT", `/api/playlists/${id}`, updatedPlaylist);
    } catch (error) {
      console.error("Failed to sync playlist update:", error);
    }
    
    const updated = playlists.map((p) => (p.id === id ? updatedPlaylist : p));
    setPlaylists(updated);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
  };

  const deletePlaylist = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/playlists/${id}`);
    } catch (error) {
      console.error("Failed to delete playlist from server:", error);
    }
    
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
  };

  const createSession = async (playlistId: string, isPublic: boolean, host: HostInfo) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    const hostPlayer: SessionPlayer = {
      id: host.id,
      username: host.username,
      avatarUrl: host.avatarUrl,
      score: 0,
      isHost: true,
      isReady: true,
    };
    const newSession: Session = {
      id: `session_${Date.now()}`,
      hostId: host.id,
      hostName: host.username,
      playlistId,
      playlistName: playlist?.name || "Unknown Playlist",
      players: [hostPlayer],
      status: "waiting",
      currentGameIndex: 0,
      isPublic,
    };
    
    try {
      const res = await apiRequest("POST", "/api/sessions", newSession);
      const serverSession = await res.json();
      const updated = [...sessions, serverSession];
      setSessions(updated);
      setCurrentSession(serverSession);
      return serverSession;
    } catch (error) {
      console.error("Failed to create session on server:", error);
      const updated = [...sessions, newSession];
      setSessions(updated);
      setCurrentSession(newSession);
      return newSession;
    }
  };

  const joinSession = async (sessionId: string, player: SessionPlayer) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.players.length < 4) {
      const updatedSession = {
        ...session,
        players: [...session.players, player],
      };
      
      try {
        await apiRequest("PUT", `/api/sessions/${sessionId}`, updatedSession);
      } catch (error) {
        console.error("Failed to update session on server:", error);
      }
      
      const updated = sessions.map((s) => (s.id === sessionId ? updatedSession : s));
      setSessions(updated);
      setCurrentSession(updatedSession);
    }
  };

  const leaveSession = async () => {
    if (currentSession) {
      try {
        await apiRequest("DELETE", `/api/sessions/${currentSession.id}`);
      } catch (error) {
        console.error("Failed to delete session from server:", error);
      }
      
      const updated = sessions.filter((s) => s.id !== currentSession.id);
      setSessions(updated);
      setCurrentSession(null);
    }
  };

  const startGame = async () => {
    if (currentSession) {
      const updatedSession = { ...currentSession, status: "playing" as const };
      
      try {
        await apiRequest("PUT", `/api/sessions/${currentSession.id}`, updatedSession);
      } catch (error) {
        console.error("Failed to update session on server:", error);
      }
      
      const updated = sessions.map((s) => (s.id === currentSession.id ? updatedSession : s));
      setSessions(updated);
      setCurrentSession(updatedSession);
    }
  };

  const endGame = async (results: { playerId: string; score: number }[]) => {
    if (currentSession) {
      const updatedPlayers = currentSession.players.map((p) => {
        const result = results.find((r) => r.playerId === p.id);
        return result ? { ...p, score: p.score + result.score } : p;
      });
      const updatedSession = {
        ...currentSession,
        players: updatedPlayers,
        currentGameIndex: currentSession.currentGameIndex + 1,
      };
      
      try {
        await apiRequest("PUT", `/api/sessions/${currentSession.id}`, updatedSession);
      } catch (error) {
        console.error("Failed to update session on server:", error);
      }
      
      const updated = sessions.map((s) => (s.id === currentSession.id ? updatedSession : s));
      setSessions(updated);
      setCurrentSession(updatedSession);
    }
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  return (
    <GameContext.Provider
      value={{
        miniGames,
        playlists,
        sessions,
        currentSession,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        createSession,
        joinSession,
        leaveSession,
        startGame,
        endGame,
        refreshSessions,
        loadPlaylists,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
