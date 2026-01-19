import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGame, Playlist } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlaylistOptionProps {
  playlist: Playlist;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function PlaylistOption({ playlist, isSelected, onSelect, index }: PlaylistOptionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        style={[
          styles.playlistOption,
          isSelected && styles.playlistOptionSelected,
          animatedStyle,
        ]}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        }}
        onPress={onSelect}
        testID={`option-playlist-${playlist.id}`}
      >
        <View style={styles.playlistOptionContent}>
          <View style={styles.playlistOptionIcon}>
            <Feather name="music" size={20} color={Colors.dark.secondary} />
          </View>
          <View style={styles.playlistOptionInfo}>
            <ThemedText type="subheading" style={styles.playlistOptionName}>
              {playlist.name}
            </ThemedText>
            <ThemedText type="caption" style={styles.playlistOptionMeta}>
              {playlist.games.length} games
            </ThemedText>
          </View>
        </View>
        <View
          style={[
            styles.radioButton,
            isSelected && styles.radioButtonSelected,
          ]}
        >
          {isSelected ? (
            <View style={styles.radioButtonInner} />
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function HostSessionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playlists, createSession } = useGame();
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const myPlaylists = playlists.filter((p) => p.creatorId === "current_user");

  const handleCreateSession = async () => {
    if (!selectedPlaylist) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const session = await createSession(selectedPlaylist, isPublic);
      navigation.replace("SessionLobby", { sessionId: session.id });
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Select Playlist
        </ThemedText>
        <ThemedText type="small" style={styles.sectionSubtitle}>
          Choose which games you want to play
        </ThemedText>
      </Animated.View>

      {myPlaylists.length > 0 ? (
        <View style={styles.playlistList}>
          {myPlaylists.map((playlist, index) => (
            <PlaylistOption
              key={playlist.id}
              playlist={playlist}
              isSelected={selectedPlaylist === playlist.id}
              onSelect={() => {
                Haptics.selectionAsync();
                setSelectedPlaylist(playlist.id);
              }}
              index={index}
            />
          ))}
        </View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.noPlaylistsCard}
        >
          <Feather name="inbox" size={32} color={Colors.dark.textSecondary} />
          <ThemedText type="body" style={styles.noPlaylistsText}>
            No playlists yet
          </ThemedText>
          <Pressable
            style={styles.createPlaylistLink}
            onPress={() => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate("CreatePlaylist", {});
              }, 300);
            }}
            testID="button-create-playlist-link"
          >
            <ThemedText type="link" style={styles.createPlaylistText}>
              Create your first playlist
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={styles.settingsSection}
      >
        <ThemedText type="h4" style={styles.sectionTitle}>
          Session Settings
        </ThemedText>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <ThemedText type="body" style={styles.settingLabel}>
              Public Session
            </ThemedText>
            <ThemedText type="caption" style={styles.settingDescription}>
              Anyone can join this session
            </ThemedText>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(value) => {
              Haptics.selectionAsync();
              setIsPublic(value);
            }}
            trackColor={{
              false: Colors.dark.backgroundSecondary,
              true: Colors.dark.primary,
            }}
            thumbColor="#FFFFFF"
            testID="switch-public"
          />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Button
          onPress={handleCreateSession}
          disabled={!selectedPlaylist || isLoading}
          style={styles.createButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            "Create Session"
          )}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
  },
  playlistList: {
    marginBottom: Spacing["3xl"],
  },
  playlistOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  playlistOptionSelected: {
    borderColor: Colors.dark.primary,
  },
  playlistOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playlistOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  playlistOptionInfo: {
    flex: 1,
  },
  playlistOptionName: {
    color: Colors.dark.text,
  },
  playlistOptionMeta: {
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: Colors.dark.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
  },
  noPlaylistsCard: {
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing["3xl"],
    marginBottom: Spacing["3xl"],
  },
  noPlaylistsText: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  createPlaylistLink: {
    paddingVertical: Spacing.sm,
  },
  createPlaylistText: {
    color: Colors.dark.primary,
  },
  settingsSection: {
    marginBottom: Spacing["3xl"],
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    color: Colors.dark.text,
  },
  settingDescription: {
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: Spacing.lg,
  },
  createButton: {
    backgroundColor: Colors.dark.primary,
  },
});
