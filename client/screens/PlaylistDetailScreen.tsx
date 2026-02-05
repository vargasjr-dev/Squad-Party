import React from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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
import { useAuth } from "@/contexts/AuthContext";
import { useGame, MiniGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest } from "@/lib/query-client";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GameItemProps {
  game: MiniGame;
  index: number;
  onPress: () => void;
}

function GameItem({ game, index, onPress }: GameItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "word":
        return "type";
      case "trivia":
        return "help-circle";
      case "speed":
        return "zap";
      case "memory":
        return "grid";
      default:
        return "play";
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <AnimatedPressable
        style={[styles.gameItem, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        testID={`game-item-${game.id}`}
      >
        <View style={styles.gameIndex}>
          <ThemedText type="small" style={styles.gameIndexText}>
            {index + 1}
          </ThemedText>
        </View>
        <View style={styles.gameIcon}>
          <Feather
            name={getTypeIcon(game.type)}
            size={18}
            color={Colors.dark.secondary}
          />
        </View>
        <View style={styles.gameInfo}>
          <ThemedText type="body" style={styles.gameName}>
            {game.name}
          </ThemedText>
          <View style={styles.gameMeta}>
            <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
            <ThemedText type="caption" style={styles.gameMetaText}>
              {game.duration}s
            </ThemedText>
          </View>
        </View>
        <Feather
          name="chevron-right"
          size={18}
          color={Colors.dark.textSecondary}
        />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "PlaylistDetail">>();
  const { playlists, miniGames, deletePlaylist, createSession } = useGame();

  const playlist = playlists.find((p) => p.id === route.params.playlistId);

  if (!playlist) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body" style={styles.notFoundText}>
          Playlist not found
        </ThemedText>
      </View>
    );
  }

  const playlistGames = playlist.games
    .map((gameId) => miniGames.find((g) => g.id === gameId))
    .filter((g): g is MiniGame => g !== undefined);

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CreatePlaylist", { playlist });
  };

  const handleGamePress = (gameId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("GameDetail", { gameId });
  };

  const handleCreateGame = async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const gameId = `custom_game_${Date.now()}`;
      const res = await apiRequest("POST", "/api/custom-games", {
        id: gameId,
        creatorId: user.id,
        playlistId: playlist.id,
      });

      const newGame = await res.json();
      navigation.navigate("GameStudio", {
        gameId: newGame.id,
        playlistId: playlist.id,
      });
    } catch (error) {
      console.error("Failed to create game:", error);
      Alert.alert("Error", "Failed to create game. Please try again.");
    }
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deletePlaylist(playlist.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handlePlay = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const session = await createSession(playlist.id, true, {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
    navigation.navigate("SessionLobby", { sessionId: session.id });
  };

  const totalDuration = playlistGames.reduce(
    (acc, game) => acc + game.duration,
    0,
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl + 100,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={playlistGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <GameItem
            game={item}
            index={index}
            onPress={() => handleGamePress(item.id)}
          />
        )}
        ListHeaderComponent={
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View style={styles.playlistHeader}>
              <View style={styles.playlistIconLarge}>
                <Feather name="music" size={32} color={Colors.dark.secondary} />
              </View>
              <View style={styles.playlistInfo}>
                <ThemedText type="h3" style={styles.playlistTitle}>
                  {playlist.name}
                </ThemedText>
                {playlist.description ? (
                  <ThemedText type="small" style={styles.playlistDescription}>
                    {playlist.description}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Feather name="layers" size={16} color={Colors.dark.primary} />
                <ThemedText type="small" style={styles.statText}>
                  {playlistGames.length} games
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <Feather name="clock" size={16} color={Colors.dark.secondary} />
                <ThemedText type="small" style={styles.statText}>
                  ~{Math.ceil(totalDuration / 60)} min
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <Feather
                  name="play-circle"
                  size={16}
                  color={Colors.dark.success}
                />
                <ThemedText type="small" style={styles.statText}>
                  {playlist.playCount} plays
                </ThemedText>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.actionButton}
                onPress={handleEdit}
                testID="button-edit"
              >
                <Feather name="edit-2" size={18} color={Colors.dark.text} />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={handleDelete}
                testID="button-delete"
              >
                <Feather name="trash-2" size={18} color={Colors.dark.error} />
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Games
              </ThemedText>
              <Pressable
                style={styles.createGameButton}
                onPress={handleCreateGame}
                testID="button-create-game"
              >
                <Feather name="plus" size={18} color={Colors.dark.secondary} />
                <ThemedText type="small" style={styles.createGameText}>
                  Create Game
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button onPress={handlePlay} style={styles.playButton}>
          Host with this Playlist
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    color: Colors.dark.textSecondary,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  playlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  playlistIconLarge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  playlistDescription: {
    color: Colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statText: {
    color: Colors.dark.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: Colors.dark.text,
  },
  createGameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.dark.backgroundDefault,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  createGameText: {
    color: Colors.dark.secondary,
  },
  gameItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  gameIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  gameIndexText: {
    color: Colors.dark.textSecondary,
    fontWeight: "600",
  },
  gameIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  gameMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  gameMetaText: {
    color: Colors.dark.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.dark.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundDefault,
  },
  playButton: {
    backgroundColor: Colors.dark.primary,
  },
});
