import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useGame, Playlist } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest } from "@/lib/query-client";

interface DraftGame {
  id: string;
  creatorId: string;
  metadata: {
    name: string;
    description: string;
    type: string;
    duration: number;
  };
  chatHistory: { id: string; role: string; content: string }[];
  updatedAt: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabType = "my" | "community";

interface PlaylistCardProps {
  playlist: Playlist;
  index: number;
  onPress: () => void;
}

function PlaylistCard({ playlist, index, onPress }: PlaylistCardProps) {
  const scale = useSharedValue(1);
  const { miniGames } = useGame();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const gameCount = playlist.games.length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <AnimatedPressable
        style={[styles.playlistCard, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        testID={`card-playlist-${playlist.id}`}
      >
        <View style={styles.playlistIcon}>
          <Feather name="music" size={24} color={Colors.dark.secondary} />
        </View>
        <View style={styles.playlistInfo}>
          <ThemedText type="subheading" style={styles.playlistName}>
            {playlist.name}
          </ThemedText>
          <ThemedText type="caption" style={styles.playlistMeta}>
            {gameCount} {gameCount === 1 ? "game" : "games"}
          </ThemedText>
        </View>
        <Feather
          name="chevron-right"
          size={20}
          color={Colors.dark.textSecondary}
        />
      </AnimatedPressable>
    </Animated.View>
  );
}

function SegmentedControl({
  selectedTab,
  onTabChange,
}: {
  selectedTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      <Pressable
        style={[
          styles.segmentButton,
          selectedTab === "my" && styles.segmentButtonActive,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onTabChange("my");
        }}
        testID="button-my-playlists"
      >
        <ThemedText
          type="small"
          style={[
            styles.segmentText,
            selectedTab === "my" && styles.segmentTextActive,
          ]}
        >
          My Playlists
        </ThemedText>
      </Pressable>
      <Pressable
        style={[
          styles.segmentButton,
          selectedTab === "community" && styles.segmentButtonActive,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onTabChange("community");
        }}
        testID="button-community"
      >
        <ThemedText
          type="small"
          style={[
            styles.segmentText,
            selectedTab === "community" && styles.segmentTextActive,
          ]}
        >
          Community
        </ThemedText>
      </Pressable>
    </View>
  );
}

function EmptyState({ isCommunity }: { isCommunity: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-playlists.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>
        {isCommunity ? "No Community Playlists" : "No Playlists Yet"}
      </ThemedText>
      <ThemedText type="body" style={styles.emptySubtitle}>
        {isCommunity
          ? "Be the first to share a playlist!"
          : "Create your first playlist to get started"}
      </ThemedText>
    </View>
  );
}

function DraftCard({
  draft,
  onPress,
}: {
  draft: DraftGame;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const messageCount = draft.chatHistory?.length || 0;
  const lastMessage = draft.chatHistory?.[draft.chatHistory.length - 1];
  const preview = lastMessage?.content?.substring(0, 50) || "No messages yet";

  return (
    <AnimatedPressable
      style={[styles.draftCard, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      testID={`draft-card-${draft.id}`}
    >
      <View style={styles.draftIcon}>
        <Feather name="cpu" size={20} color={Colors.dark.secondary} />
      </View>
      <ThemedText type="small" style={styles.draftName} numberOfLines={1}>
        {draft.metadata.name}
      </ThemedText>
      <ThemedText type="caption" style={styles.draftPreview} numberOfLines={2}>
        {preview}...
      </ThemedText>
      <View style={styles.draftMeta}>
        <Feather
          name="message-circle"
          size={12}
          color={Colors.dark.textSecondary}
        />
        <ThemedText type="caption" style={styles.draftMetaText}>
          {messageCount}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

export default function PlaylistsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playlists, loadPlaylists } = useGame();
  const [selectedTab, setSelectedTab] = useState<TabType>("my");
  const [drafts, setDrafts] = useState<DraftGame[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const loadDrafts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingDrafts(true);
      const res = await apiRequest(
        "GET",
        `/api/custom-games?userId=${user.id}&drafts=true`,
      );
      const data = await res.json();
      setDrafts(data);
    } catch (error) {
      console.error("Failed to load drafts:", error);
    } finally {
      setLoadingDrafts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadPlaylists(user.id);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts]),
  );

  const filteredPlaylists =
    selectedTab === "my"
      ? playlists.filter((p) => p.creatorId === user?.id)
      : playlists.filter((p) => p.isPublic);

  const handlePlaylistPress = (playlist: Playlist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("PlaylistDetail", { playlistId: playlist.id });
  };

  const handleDraftPress = (draft: DraftGame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("GameStudio", { gameId: draft.id });
  };

  const handleNewGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("GameStudio", {});
  };

  const renderDraftsSection = () => {
    if (loadingDrafts) {
      return (
        <View style={styles.draftsSection}>
          <View style={styles.draftsSectionHeader}>
            <ThemedText type="subheading" style={styles.draftsSectionTitle}>
              Game Studio
            </ThemedText>
          </View>
          <View style={styles.draftsLoading}>
            <ActivityIndicator size="small" color={Colors.dark.primary} />
          </View>
        </View>
      );
    }

    return (
      <Animated.View entering={FadeIn} style={styles.draftsSection}>
        <View style={styles.draftsSectionHeader}>
          <ThemedText type="subheading" style={styles.draftsSectionTitle}>
            Game Studio
          </ThemedText>
          <Pressable onPress={handleNewGame} style={styles.newGameButton}>
            <Feather name="plus" size={16} color={Colors.dark.secondary} />
            <ThemedText type="caption" style={styles.newGameText}>
              New Game
            </ThemedText>
          </Pressable>
        </View>

        {drafts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.draftsScroll}
          >
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onPress={() => handleDraftPress(draft)}
              />
            ))}
          </ScrollView>
        ) : (
          <Pressable style={styles.emptyDrafts} onPress={handleNewGame}>
            <View style={styles.emptyDraftsIcon}>
              <Feather name="cpu" size={24} color={Colors.dark.textSecondary} />
            </View>
            <ThemedText type="body" style={styles.emptyDraftsText}>
              Create your first game with AI
            </ThemedText>
            <Feather
              name="chevron-right"
              size={18}
              color={Colors.dark.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl + 80,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredPlaylists}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PlaylistCard
            playlist={item}
            index={index}
            onPress={() => handlePlaylistPress(item)}
          />
        )}
        ListHeaderComponent={
          <>
            {renderDraftsSection()}
            <SegmentedControl
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            />
          </>
        }
        ListEmptyComponent={
          <EmptyState isCommunity={selectedTab === "community"} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  segmentButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  segmentText: {
    color: Colors.dark.textSecondary,
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  playlistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  playlistMeta: {
    color: Colors.dark.textSecondary,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["3xl"],
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  draftsSection: {
    marginBottom: Spacing.xl,
  },
  draftsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  draftsSectionTitle: {
    color: Colors.dark.text,
  },
  newGameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  newGameText: {
    color: Colors.dark.secondary,
  },
  draftsLoading: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  draftsScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  draftCard: {
    width: 140,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  draftIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  draftName: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  draftPreview: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    height: 32,
  },
  draftMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  draftMetaText: {
    color: Colors.dark.textSecondary,
  },
  emptyDrafts: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
    borderStyle: "dashed",
  },
  emptyDraftsIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  emptyDraftsText: {
    flex: 1,
    color: Colors.dark.textSecondary,
  },
});
