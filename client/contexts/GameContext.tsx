import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface GameContextType {
  miniGames: MiniGame[];
  playlists: Playlist[];
  sessions: Session[];
  currentSession: Session | null;
  createPlaylist: (name: string, description: string, gameIds: string[]) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  createSession: (playlistId: string, isPublic: boolean) => Promise<Session>;
  joinSession: (sessionId: string, player: SessionPlayer) => Promise<void>;
  leaveSession: () => Promise<void>;
  startGame: () => Promise<void>;
  endGame: (results: { playerId: string; score: number }[]) => Promise<void>;
  refreshSessions: () => Promise<void>;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedPlaylists, storedSessions] = await Promise.all([
        AsyncStorage.getItem(PLAYLISTS_KEY),
        AsyncStorage.getItem(SESSIONS_KEY),
      ]);
      if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
      if (storedSessions) setSessions(JSON.parse(storedSessions));
    } catch (error) {
      console.error("Failed to load game data:", error);
    }
  };

  const savePlaylists = async (newPlaylists: Playlist[]) => {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(newPlaylists));
    setPlaylists(newPlaylists);
  };

  const saveSessions = async (newSessions: Session[]) => {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  const createPlaylist = async (name: string, description: string, gameIds: string[]) => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name,
      description,
      games: gameIds,
      creatorId: "current_user",
      isPublic: false,
      playCount: 0,
    };
    const updated = [...playlists, newPlaylist];
    await savePlaylists(updated);
    return newPlaylist;
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    const updated = playlists.map((p) => (p.id === id ? { ...p, ...updates } : p));
    await savePlaylists(updated);
  };

  const deletePlaylist = async (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    await savePlaylists(updated);
  };

  const createSession = async (playlistId: string, isPublic: boolean) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    const newSession: Session = {
      id: `session_${Date.now()}`,
      hostId: "current_user",
      hostName: "You",
      playlistId,
      playlistName: playlist?.name || "Unknown Playlist",
      players: [],
      status: "waiting",
      currentGameIndex: 0,
      isPublic,
    };
    const updated = [...sessions, newSession];
    await saveSessions(updated);
    setCurrentSession(newSession);
    return newSession;
  };

  const joinSession = async (sessionId: string, player: SessionPlayer) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session && session.players.length < 4) {
      const updatedSession = {
        ...session,
        players: [...session.players, player],
      };
      const updated = sessions.map((s) => (s.id === sessionId ? updatedSession : s));
      await saveSessions(updated);
      setCurrentSession(updatedSession);
    }
  };

  const leaveSession = async () => {
    if (currentSession) {
      const updated = sessions.filter((s) => s.id !== currentSession.id);
      await saveSessions(updated);
      setCurrentSession(null);
    }
  };

  const startGame = async () => {
    if (currentSession) {
      const updatedSession = { ...currentSession, status: "playing" as const };
      const updated = sessions.map((s) => (s.id === currentSession.id ? updatedSession : s));
      await saveSessions(updated);
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
      const updated = sessions.map((s) => (s.id === currentSession.id ? updatedSession : s));
      await saveSessions(updated);
      setCurrentSession(updatedSession);
    }
  };

  const refreshSessions = async () => {
    await loadData();
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
