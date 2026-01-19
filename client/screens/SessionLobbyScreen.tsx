import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGame, SessionPlayer } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlayerSlotProps {
  player?: SessionPlayer;
  index: number;
}

function PlayerSlot({ player, index }: PlayerSlotProps) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (!player) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 10, stiffness: 100 }),
          withSpring(1, { damping: 10, stiffness: 100 })
        ),
        -1,
        true
      );
    }
  }, [player]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: player ? 1 : pulseScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[styles.playerSlot, pulseStyle]}
    >
      {player ? (
        <>
          <Image
            source={require("../../assets/images/avatar-placeholder.png")}
            style={styles.playerAvatar}
          />
          <ThemedText type="subheading" style={styles.playerName}>
            {player.username}
          </ThemedText>
          {player.isHost ? (
            <View style={styles.hostBadge}>
              <Feather name="star" size={12} color={Colors.dark.gold} />
              <ThemedText type="caption" style={styles.hostBadgeText}>
                Host
              </ThemedText>
            </View>
          ) : player.isReady ? (
            <View style={styles.readyBadge}>
              <Feather name="check" size={12} color={Colors.dark.success} />
              <ThemedText type="caption" style={styles.readyBadgeText}>
                Ready
              </ThemedText>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.emptySlot}>
            <Feather name="user-plus" size={28} color={Colors.dark.textSecondary} />
          </View>
          <ThemedText type="small" style={styles.waitingText}>
            Waiting...
          </ThemedText>
        </>
      )}
    </Animated.View>
  );
}

export default function SessionLobbyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SessionLobby">>();
  const { sessions, currentSession, leaveSession, startGame } = useGame();

  const session = sessions.find((s) => s.id === route.params.sessionId) || currentSession;

  const players: (SessionPlayer | undefined)[] = [
    ...(session?.players || []),
    ...Array(4 - (session?.players.length || 0)).fill(undefined),
  ];

  const isHost = session?.hostId === "current_user";
  const canStart = (session?.players.length || 0) >= 2;

  const handleLeave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await leaveSession();
    navigation.goBack();
  };

  const handleStart = async () => {
    if (!session || !canStart) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await startGame();
    navigation.replace("GamePlay", { sessionId: session.id, gameIndex: 0 });
  };

  if (!session) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeIn.delay(100)} style={styles.playlistBanner}>
          <Feather name="music" size={18} color={Colors.dark.secondary} />
          <ThemedText type="body" style={styles.playlistName}>
            {session.playlistName}
          </ThemedText>
        </Animated.View>

        <View style={styles.playersGrid}>
          {players.map((player, index) => (
            <PlayerSlot key={index} player={player} index={index} />
          ))}
        </View>

        <View style={styles.footer}>
          {isHost ? (
            <Button
              onPress={handleStart}
              disabled={!canStart}
              style={styles.startButton}
            >
              {canStart ? "Start Game" : "Need more players"}
            </Button>
          ) : (
            <View style={styles.waitingForHost}>
              <ActivityIndicator size="small" color={Colors.dark.primary} />
              <ThemedText type="body" style={styles.waitingForHostText}>
                Waiting for host to start...
              </ThemedText>
            </View>
          )}

          <Pressable
            style={styles.leaveButton}
            onPress={handleLeave}
            testID="button-leave"
          >
            <Feather name="log-out" size={18} color={Colors.dark.error} />
            <ThemedText type="body" style={styles.leaveButtonText}>
              Leave Session
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  playlistBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing["3xl"],
  },
  playlistName: {
    color: Colors.dark.text,
    marginLeft: Spacing.sm,
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    flex: 1,
  },
  playerSlot: {
    width: "48%",
    aspectRatio: 0.9,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  playerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  playerName: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.gold + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  hostBadgeText: {
    color: Colors.dark.gold,
    marginLeft: Spacing.xs,
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.success + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  readyBadgeText: {
    color: Colors.dark.success,
    marginLeft: Spacing.xs,
  },
  emptySlot: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark.backgroundTertiary,
    borderStyle: "dashed",
  },
  waitingText: {
    color: Colors.dark.textSecondary,
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  startButton: {
    backgroundColor: Colors.dark.primary,
    marginBottom: Spacing.lg,
  },
  waitingForHost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  waitingForHostText: {
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.md,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  leaveButtonText: {
    color: Colors.dark.error,
    marginLeft: Spacing.sm,
  },
});
