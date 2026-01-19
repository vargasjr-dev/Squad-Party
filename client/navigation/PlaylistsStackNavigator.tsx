import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PlaylistsScreen from "@/screens/PlaylistsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export type PlaylistsStackParamList = {
  Playlists: undefined;
};

const Stack = createNativeStackNavigator<PlaylistsStackParamList>();

function AddPlaylistButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate("CreatePlaylist", {})}
      hitSlop={8}
      testID="button-add-playlist"
    >
      <Feather name="plus" size={24} color={theme.text} />
    </Pressable>
  );
}

export default function PlaylistsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{
          headerTitle: "Playlists",
          headerRight: () => <AddPlaylistButton />,
        }}
      />
    </Stack.Navigator>
  );
}
