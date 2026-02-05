import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface RankCardProps {
  rank: number;
  username: string;
  score: number;
  isCurrentUser: boolean;
  delay: number;
}

function RankCard({
  rank,
  username,
  score,
  isCurrentUser,
  delay,
}: RankCardProps) {
  const getRankColor = () => {
    switch (rank) {
      case 1:
        return Colors.dark.gold;
      case 2:
        return Colors.dark.silver;
      case 3:
        return Colors.dark.bronze;
      default:
        return Colors.dark.textSecondary;
    }
  };

  const getRankScale = () => {
    switch (rank) {
      case 1:
        return 1.1;
      case 2:
        return 1;
      case 3:
        return 0.95;
      default:
        return 0.9;
    }
  };

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return "award";
      case 2:
        return "star";
      case 3:
        return "zap";
      default:
        return "circle";
    }
  };

  const color = getRankColor();
  const scale = getRankScale();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        styles.rankCard,
        {
          transform: [{ scale }],
          borderColor: isCurrentUser ? Colors.dark.primary : "transparent",
          borderWidth: isCurrentUser ? 2 : 0,
        },
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: color + "20" }]}>
        <Feather name={getRankIcon()} size={20} color={color} />
        <ThemedText type="h4" style={[styles.rankNumber, { color }]}>
          {rank}
        </ThemedText>
      </View>

      <View style={styles.playerInfo}>
        <Image
          source={require("../../assets/images/avatar-placeholder.png")}
          style={styles.playerAvatar}
        />
        <View style={styles.playerDetails}>
          <ThemedText type="subheading" style={styles.playerName}>
            {username} {isCurrentUser ? "(You)" : ""}
          </ThemedText>
          <ThemedText type="h3" style={[styles.playerScore, { color }]}>
            {score.toLocaleString()} pts
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function RoundResultsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RoundResults">>();
  const { currentSession, playlists, leaveSession } = useGame();

  const mockResults = [
    { id: "current_user", username: "You", score: 850 },
    { id: "player2", username: "Player 2", score: 720 },
    { id: "player3", username: "Player 3", score: 580 },
    { id: "player4", username: "Player 4", score: 340 },
  ].sort((a, b) => b.score - a.score);

  const playlist = playlists.find((p) => p.id === currentSession?.playlistId);
  const totalGames = playlist?.games.length || 3;
  const currentGameIndex = route.params.gameIndex;
  const hasMoreGames = currentGameIndex < totalGames - 1;

  const handleNextRound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("GamePlay", {
      sessionId: route.params.sessionId,
      gameIndex: currentGameIndex + 1,
    });
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await leaveSession();
    navigation.popToTop();
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundRoot, Colors.dark.backgroundDefault]}
      style={styles.container}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <ThemedText type="display" style={styles.title}>
            Round Complete!
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Game {currentGameIndex + 1} of {totalGames}
          </ThemedText>
        </Animated.View>

        <View style={styles.resultsContainer}>
          {mockResults.map((player, index) => (
            <RankCard
              key={player.id}
              rank={index + 1}
              username={player.username}
              score={player.score}
              isCurrentUser={player.id === "current_user"}
              delay={200 + index * 150}
            />
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.footer}
        >
          {hasMoreGames ? (
            <Button onPress={handleNextRound} style={styles.nextButton}>
              Next Round
            </Button>
          ) : (
            <Button onPress={handleFinish} style={styles.finishButton}>
              Finish Game
            </Button>
          )}

          <Pressable
            style={styles.quitButton}
            onPress={handleFinish}
            testID="button-quit"
          >
            <Feather name="x" size={18} color={Colors.dark.textSecondary} />
            <ThemedText type="body" style={styles.quitButtonText}>
              Quit Game
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.md,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  rankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  rankNumber: {
    marginTop: -2,
  },
  playerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  playerScore: {
    fontWeight: "700",
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  nextButton: {
    backgroundColor: Colors.dark.primary,
    marginBottom: Spacing.lg,
  },
  finishButton: {
    backgroundColor: Colors.dark.success,
    marginBottom: Spacing.lg,
  },
  quitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  quitButtonText: {
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
});
