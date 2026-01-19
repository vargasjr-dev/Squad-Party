import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import HostSessionScreen from "@/screens/HostSessionScreen";
import SessionLobbyScreen from "@/screens/SessionLobbyScreen";
import GamePlayScreen from "@/screens/GamePlayScreen";
import RoundResultsScreen from "@/screens/RoundResultsScreen";
import CreatePlaylistScreen from "@/screens/CreatePlaylistScreen";
import PlaylistDetailScreen from "@/screens/PlaylistDetailScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { Playlist } from "@/contexts/GameContext";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  HostSession: undefined;
  SessionLobby: { sessionId: string };
  GamePlay: { sessionId: string; gameIndex: number };
  RoundResults: { sessionId: string; gameIndex: number };
  CreatePlaylist: { playlist?: Playlist };
  PlaylistDetail: { playlistId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HostSession"
            component={HostSessionScreen}
            options={{
              presentation: "modal",
              headerTitle: "Host Session",
            }}
          />
          <Stack.Screen
            name="SessionLobby"
            component={SessionLobbyScreen}
            options={{
              headerTitle: "Session Lobby",
            }}
          />
          <Stack.Screen
            name="GamePlay"
            component={GamePlayScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="RoundResults"
            component={RoundResultsScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="CreatePlaylist"
            component={CreatePlaylistScreen}
            options={{
              presentation: "modal",
              headerTitle: "New Playlist",
            }}
          />
          <Stack.Screen
            name="PlaylistDetail"
            component={PlaylistDetailScreen}
            options={{
              headerTitle: "Playlist",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerTitle: "Settings",
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
