import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useGame, MiniGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const SAMPLE_WORDS = [
  "PARTY",
  "SQUAD",
  "GAMES",
  "QUICK",
  "BLAST",
  "FLASH",
  "STORM",
  "CROWN",
  "CHAMP",
  "GLORY",
  "SWIFT",
  "BRAVE",
  "POWER",
  "BONUS",
  "TURBO",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GamePlayScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "GamePlay">>();
  const { currentSession, miniGames, playlists, endGame } = useGame();

  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [scrambledWord, setScrambledWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [wordsCompleted, setWordsCompleted] = useState(0);

  const timerProgress = useSharedValue(1);
  const scoreScale = useSharedValue(1);

  const scrambleWord = (word: string): string => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const scrambled = arr.join("");
    // Avoid infinite recursion for single-char words
    if (word.length <= 1) return word;
    return scrambled === word ? scrambleWord(word) : scrambled;
  };

  const getNextWord = useCallback(() => {
    const word = SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)];
    setCurrentWord(word);
    setScrambledWord(scrambleWord(word));
    setUserInput("");
  }, []);

  useEffect(() => {
    getNextWord();
  }, []);

  useEffect(() => {
    timerProgress.value = withTiming(0, { duration: 60000 });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGameEnd = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await endGame([{ playerId: "current_user", score }]);
    navigation.replace("RoundResults", {
      sessionId: route.params.sessionId,
      gameIndex: route.params.gameIndex,
    });
  };

  const handleSubmit = () => {
    if (userInput.toUpperCase() === currentWord) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const points = Math.max(100, 200 - (60 - timeLeft) * 2);
      setScore((prev) => prev + points);
      setWordsCompleted((prev) => prev + 1);
      scoreScale.value = withSpring(1.2, { damping: 10 }, () => {
        scoreScale.value = withSpring(1);
      });
      getNextWord();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    getNextWord();
  };

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const timerColor = timeLeft <= 10 ? Colors.dark.error : Colors.dark.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.timerContainer}>
          <Feather name="clock" size={18} color={timerColor} />
          <ThemedText
            type="h4"
            style={[styles.timerText, { color: timerColor }]}
          >
            {timeLeft}s
          </ThemedText>
        </View>
        <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
          <ThemedText type="h4" style={styles.scoreText}>
            {score}
          </ThemedText>
          <ThemedText type="caption" style={styles.scoreLabel}>
            points
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.timerBar}>
        <Animated.View
          style={[
            styles.timerProgress,
            { backgroundColor: timerColor },
            timerAnimatedStyle,
          ]}
        />
      </View>

      <View style={styles.gameContent}>
        <Animated.View entering={FadeIn} style={styles.gameCard}>
          <ThemedText type="caption" style={styles.gameLabel}>
            Unscramble this word
          </ThemedText>
          <ThemedText type="display" style={styles.scrambledWord}>
            {scrambledWord}
          </ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userInput}
              onChangeText={(text) => setUserInput(text.toUpperCase())}
              placeholder="Type your answer..."
              placeholderTextColor={Colors.dark.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={currentWord.length}
              testID="input-answer"
            />
          </View>

          <View style={styles.buttonRow}>
            <AnimatedPressable
              style={styles.skipButton}
              onPress={handleSkip}
              testID="button-skip"
            >
              <Feather
                name="skip-forward"
                size={20}
                color={Colors.dark.textSecondary}
              />
              <ThemedText type="small" style={styles.skipButtonText}>
                Skip
              </ThemedText>
            </AnimatedPressable>

            <AnimatedPressable
              style={[
                styles.submitButton,
                userInput.length !== currentWord.length &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={userInput.length !== currentWord.length}
              testID="button-submit"
            >
              <ThemedText type="subheading" style={styles.submitButtonText}>
                Submit
              </ThemedText>
              <Feather name="check" size={20} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather
              name="check-circle"
              size={16}
              color={Colors.dark.success}
            />
            <ThemedText type="small" style={styles.statText}>
              {wordsCompleted} completed
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    marginLeft: Spacing.sm,
  },
  scoreContainer: {
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  scoreText: {
    color: Colors.dark.gold,
  },
  scoreLabel: {
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  timerBar: {
    height: 4,
    backgroundColor: Colors.dark.backgroundDefault,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerProgress: {
    height: "100%",
    borderRadius: 2,
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["3xl"],
  },
  gameCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    alignItems: "center",
  },
  gameLabel: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.lg,
  },
  scrambledWord: {
    color: Colors.dark.secondary,
    letterSpacing: 8,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  input: {
    height: Spacing.inputHeight,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark.text,
    textAlign: "center",
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  skipButtonText: {
    color: Colors.dark.textSecondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statText: {
    color: Colors.dark.textSecondary,
  },
});
