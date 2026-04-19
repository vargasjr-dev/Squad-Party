import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Pressable,
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
import { useGame, Session } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SessionCardProps {
  session: Session;
  index: number;
  onJoin: () => void;
}

function SessionCard({ session, index, onJoin }: SessionCardProps) {
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

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <AnimatedPressable
        style={[styles.sessionCard, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onJoin}
        testID={`card-session-${session.id}`}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.hostInfo}>
            <Image
              source={require("../../assets/images/avatar-placeholder.png")}
              style={styles.hostAvatar}
            />
            <View>
              <ThemedText type="subheading" style={styles.hostName}>
                {session.hostName}
              </ThemedText>
              <ThemedText type="caption" style={styles.playlistName}>
                {session.playlistName}
              </ThemedText>
            </View>
          </View>
          <View style={styles.playerCount}>
            <Feather name="users" size={16} color={Colors.dark.textSecondary} />
            <ThemedText type="small" style={styles.playerCountText}>
              {session.players.length}/4
            </ThemedText>
          </View>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    session.status === "waiting"
                      ? Colors.dark.success
                      : Colors.dark.primary,
                },
              ]}
            />
            <ThemedText type="caption" style={styles.statusText}>
              {session.status === "waiting"
                ? "Waiting for players"
                : "In progress"}
            </ThemedText>
          </View>
          {session.status === "waiting" && session.players.length < 4 ? (
            <View style={styles.joinButton}>
              <ThemedText type="small" style={styles.joinButtonText}>
                Join
              </ThemedText>
            </View>
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-play.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No Active Sessions
      </ThemedText>
      <ThemedText type="body" style={styles.emptySubtitle}>
        Host a session to start playing with friends!
      </ThemedText>
    </View>
  );
}

export default function PlayScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { sessions, refreshSessions, joinSession } = useGame();
  const [refreshing, setRefreshing] = useState(false);

  const activeSessions = sessions.filter(
    (s) => s.status === "waiting" && s.isPublic,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  }, [refreshSessions]);

  const handleJoinSession = async (session: Session) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await joinSession(session.id, {
      id: `player_${Date.now()}`,
      username: "Player",
      avatarUrl: null,
      score: 0,
      isHost: false,
      isReady: false,
    });
    navigation.navigate("SessionLobby", { sessionId: session.id });
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={activeSessions}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <SessionCard
          session={item}
          index={index}
          onJoin={() => handleJoinSession(item)}
        />
      )}
      ListEmptyComponent={EmptyState}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.dark.primary}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  sessionCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  hostName: {
    color: Colors.dark.text,
  },
  playlistName: {
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  playerCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  playerCountText: {
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.xs,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    color: Colors.dark.textSecondary,
  },
  joinButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["5xl"],
  },
  emptyImage: {
    width: 200,
    height: 200,
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
