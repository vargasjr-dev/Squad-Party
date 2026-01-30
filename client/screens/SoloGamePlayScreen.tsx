import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
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
  withSequence,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { createGameRunner, LuaGameInterface, GameState } from "@/lib/luaInterpreter";

interface CustomGameData {
  id: string;
  metadata: {
    name: string;
    description: string;
    type: string;
    duration: number;
    rules: string[];
  };
  logicLua: string;
  assets: Record<string, string>;
}

const WORD_SCRAMBLE_WORDS = [
  { word: "PARTY", scrambled: "YRPTA" },
  { word: "GAMES", scrambled: "SGAEM" },
  { word: "SQUAD", scrambled: "DQUAS" },
  { word: "FRIEND", scrambled: "RFIEND" },
  { word: "PLAYER", scrambled: "LYAEPR" },
  { word: "WINNER", scrambled: "NNIREW" },
  { word: "SCORE", scrambled: "RSOCE" },
  { word: "FAST", scrambled: "SFTA" },
  { word: "TIME", scrambled: "MTIE" },
  { word: "WORD", scrambled: "RWDO" },
];

const SPEED_TYPING_WORDS = [
  "quick", "brown", "fox", "jumps", "lazy", "dog",
  "party", "game", "squad", "friend", "player", "winner",
];

export default function SoloGamePlayScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "SoloGamePlay">>();
  const { miniGames } = useGame();

  const builtInGame = miniGames.find((g) => g.id === route.params.gameId);
  const [customGame, setCustomGame] = useState<CustomGameData | null>(null);
  const [isLoadingCustomGame, setIsLoadingCustomGame] = useState(false);
  const [luaRunner, setLuaRunner] = useState<LuaGameInterface | null>(null);
  const [luaGameState, setLuaGameState] = useState<GameState | null>(null);
  const [luaError, setLuaError] = useState<string | null>(null);

  const game = builtInGame || (customGame ? {
    id: customGame.id,
    name: customGame.metadata.name,
    description: customGame.metadata.description,
    type: customGame.metadata.type as "word" | "trivia" | "speed" | "memory",
    duration: customGame.metadata.duration,
    rules: customGame.metadata.rules,
    icon: "zap" as const,
    color: Colors.dark.primary,
  } : null);

  const isCustomGame = !builtInGame && customGame !== null;

  useEffect(() => {
    if (!builtInGame && route.params.gameId) {
      setIsLoadingCustomGame(true);
      fetch(new URL(`/api/games/${route.params.gameId}/artifacts`, getApiUrl()).toString())
        .then(res => res.json())
        .then(data => {
          setCustomGame(data);
          
          if (data.logicLua) {
            try {
              const runner = createGameRunner(data.logicLua);
              if (runner) {
                setLuaRunner(runner);
                const initialState = runner.init();
                const startedState = runner.start(initialState);
                const withChallenge = runner.getNextChallenge(startedState);
                setLuaGameState(withChallenge);
              } else {
                setLuaError("Failed to initialize game logic");
              }
            } catch (err) {
              console.error("Lua error:", err);
              setLuaError("Error running game logic");
            }
          }
          
          setIsLoadingCustomGame(false);
        })
        .catch(err => {
          console.error("Failed to load custom game:", err);
          setIsLoadingCustomGame(false);
        });
    }
  }, [builtInGame, route.params.gameId]);

  const [timeLeft, setTimeLeft] = useState(game?.duration || 60);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [correctWords, setCorrectWords] = useState(0);

  const shakeValue = useSharedValue(0);
  const progressWidth = useSharedValue(100);

  const currentWord = WORD_SCRAMBLE_WORDS[currentWordIndex % WORD_SCRAMBLE_WORDS.length];
  const currentTypingWord = SPEED_TYPING_WORDS[currentWordIndex % SPEED_TYPING_WORDS.length];

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsGameOver(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      progressWidth.value = withSpring(((timeLeft - 1) / (game?.duration || 60)) * 100);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, game?.duration]);

  const handleSubmit = useCallback(() => {
    if (isGameOver) return;

    if (isCustomGame && luaRunner && luaGameState) {
      try {
        const result = luaRunner.onInput(luaGameState, input);
        if (result.correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScore((prev) => prev + result.points);
          setCorrectWords((prev) => prev + 1);
          const nextState = luaRunner.getNextChallenge(result.state);
          setLuaGameState(nextState);
          setInput("");
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setLuaGameState(result.state);
          shakeValue.value = withSequence(
            withSpring(-10),
            withSpring(10),
            withSpring(-10),
            withSpring(0)
          );
        }
      } catch (err) {
        console.error("Lua onInput error:", err);
      }
      return;
    }

    const isCorrect = game?.type === "speed"
      ? input.toLowerCase() === currentTypingWord.toLowerCase()
      : input.toUpperCase() === currentWord.word;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const points = game?.type === "speed" ? 10 : input.length * 10;
      setScore((prev) => prev + points);
      setCorrectWords((prev) => prev + 1);
      setCurrentWordIndex((prev) => prev + 1);
      setInput("");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeValue.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(-10),
        withSpring(0)
      );
    }
  }, [input, currentWord, currentTypingWord, isGameOver, game?.type, isCustomGame, luaRunner, luaGameState]);

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeLeft(game?.duration || 60);
    setScore(0);
    setInput("");
    setCurrentWordIndex(0);
    setIsGameOver(false);
    setCorrectWords(0);
    progressWidth.value = 100;
    
    if (isCustomGame && luaRunner) {
      try {
        const initialState = luaRunner.init();
        const startedState = luaRunner.start(initialState);
        const withChallenge = luaRunner.getNextChallenge(startedState);
        setLuaGameState(withChallenge);
      } catch (err) {
        console.error("Lua restart error:", err);
      }
    }
  };

  const handleExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    if (game?.duration && timeLeft === 60 && game.duration !== 60) {
      setTimeLeft(game.duration);
    }
  }, [game?.duration]);

  if (isLoadingCustomGame) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText type="body" style={{ marginTop: Spacing.lg }}>Loading game...</ThemedText>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body">Game not found</ThemedText>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: Spacing.lg }}>
          <ThemedText type="body" style={{ color: Colors.dark.primary }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (luaError) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={Colors.dark.error} />
        <ThemedText type="h4" style={{ marginTop: Spacing.lg, textAlign: "center" }}>Game Error</ThemedText>
        <ThemedText type="body" style={{ marginTop: Spacing.sm, color: Colors.dark.textSecondary, textAlign: "center" }}>
          {luaError}
        </ThemedText>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: Spacing.xl }}>
          <ThemedText type="body" style={{ color: Colors.dark.primary }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (isGameOver) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
        <Animated.View entering={FadeIn} style={styles.gameOverContainer}>
          <View style={styles.trophyContainer}>
            <Feather name="award" size={80} color={Colors.dark.secondary} />
          </View>
          <ThemedText type="h1" style={styles.gameOverTitle}>
            Time's Up!
          </ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="h2" style={styles.statValue}>
                {score}
              </ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>
                Points
              </ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText type="h2" style={styles.statValue}>
                {correctWords}
              </ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>
                Correct
              </ThemedText>
            </View>
          </View>
          <View style={styles.gameOverActions}>
            <Button onPress={handlePlayAgain} variant="primary">
              <ThemedText type="body" style={{ color: Colors.dark.backgroundRoot }}>
                Play Again
              </ThemedText>
            </Button>
            <Button onPress={handleExit} variant="secondary">
              <ThemedText type="body" style={{ color: Colors.dark.text }}>
                Exit
              </ThemedText>
            </Button>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.exitButton}
          onPress={handleExit}
          testID="button-close-game"
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.timerContainer}>
          <Feather name="clock" size={16} color={Colors.dark.primary} />
          <ThemedText type="h3" style={[styles.timer, timeLeft <= 10 && styles.timerWarning]}>
            {timeLeft}s
          </ThemedText>
        </View>
        <View style={styles.scoreContainer}>
          <ThemedText type="body" style={styles.scoreLabel}>Score</ThemedText>
          <ThemedText type="h3" style={styles.scoreValue}>{score}</ThemedText>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
      </View>

      <View style={styles.gameArea}>
        <Animated.View entering={FadeInDown.springify()} style={styles.wordContainer}>
          {isCustomGame && luaGameState ? (
            <>
              <ThemedText type="caption" style={styles.instruction}>
                {luaGameState.currentChallenge ? "Your challenge:" : "Loading..."}
              </ThemedText>
              <ThemedText type="h1" style={styles.scrambledWord}>
                {luaGameState.currentChallenge || "..."}
              </ThemedText>
              {luaGameState.wrongGuesses > 0 && luaGameState.maxWrongGuesses > 0 ? (
                <ThemedText type="caption" style={styles.wrongGuessInfo}>
                  Wrong: {luaGameState.wrongGuesses} / {luaGameState.maxWrongGuesses}
                </ThemedText>
              ) : null}
            </>
          ) : (
            <>
              <ThemedText type="caption" style={styles.instruction}>
                {game.type === "speed" ? "Type this word:" : "Unscramble:"}
              </ThemedText>
              <ThemedText type="h1" style={styles.scrambledWord}>
                {game.type === "speed" ? currentTypingWord : currentWord.scrambled}
              </ThemedText>
            </>
          )}
        </Animated.View>

        <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isCustomGame ? "Enter your guess..." : "Type your answer..."}
            placeholderTextColor={Colors.dark.textSecondary}
            autoCapitalize={isCustomGame ? "characters" : (game.type === "speed" ? "none" : "characters")}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            testID="input-answer"
          />
          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit}
            testID="button-submit-answer"
          >
            <Feather name="arrow-right" size={24} color={Colors.dark.backgroundRoot} />
          </Pressable>
        </Animated.View>

        <View style={styles.hintContainer}>
          <ThemedText type="small" style={styles.hintText}>
            Words completed: {correctWords}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  timer: {
    color: Colors.dark.text,
  },
  timerWarning: {
    color: Colors.dark.primary,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  scoreValue: {
    color: Colors.dark.secondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.dark.backgroundDefault,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  wordContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  instruction: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  scrambledWord: {
    color: Colors.dark.secondary,
    fontSize: 48,
    letterSpacing: 8,
    textAlign: "center",
  },
  wrongGuessInfo: {
    color: Colors.dark.error,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: Colors.dark.text,
    fontFamily: "Poppins_400Regular",
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  hintContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  hintText: {
    color: Colors.dark.textSecondary,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  trophyContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  gameOverTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing["3xl"],
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  statValue: {
    color: Colors.dark.secondary,
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  gameOverActions: {
    width: "100%",
    gap: Spacing.md,
  },
});
