import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useGame, Playlist } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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
        <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
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

export default function PlaylistsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playlists, loadPlaylists } = useGame();
  const [selectedTab, setSelectedTab] = useState<TabType>("my");

  useEffect(() => {
    if (user?.id) {
      loadPlaylists(user.id);
    }
  }, [user?.id]);

  const filteredPlaylists =
    selectedTab === "my"
      ? playlists.filter((p) => p.creatorId === user?.id)
      : playlists.filter((p) => p.isPublic);

  const handlePlaylistPress = (playlist: Playlist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("PlaylistDetail", { playlistId: playlist.id });
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
          <SegmentedControl
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        }
        ListEmptyComponent={<EmptyState isCommunity={selectedTab === "community"} />}
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
});
