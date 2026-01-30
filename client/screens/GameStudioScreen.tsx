import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface GameMetadata {
  name: string;
  description: string;
  type: "word" | "trivia" | "speed" | "memory" | "custom";
  duration: number;
  rules: string[];
  version: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  executionId?: string;
}

interface CustomGame {
  id: string;
  creatorId: string;
  playlistId: string | null;
  metadata: GameMetadata;
  logicLua: string;
  assets: Record<string, string>;
  chatHistory: ChatMessage[];
  isPublished: boolean;
}

type TabType = "chat" | "preview" | "code";

export default function GameStudioScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "GameStudio">>();

  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [game, setGame] = useState<CustomGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [codeTab, setCodeTab] = useState<"metadata" | "logic">("metadata");
  const flatListRef = useRef<FlatList>(null);

  const gameId = route.params?.gameId;

  useEffect(() => {
    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId]);

  const loadGame = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("GET", `/api/custom-games/${id}`);
      const gameData = await res.json();
      setGame(gameData);
    } catch (error) {
      console.error("Failed to load game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewGame = async (): Promise<CustomGame | null> => {
    if (!user) return null;
    
    try {
      const newId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const res = await apiRequest("POST", "/api/custom-games", {
        id: newId,
        creatorId: user.id,
        playlistId: null,
      });
      const newGame = await res.json();
      return newGame;
    } catch (error) {
      console.error("Failed to create game:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);

    const userMessage = message.trim();
    setMessage("");

    // Create a new game draft if one doesn't exist
    let currentGame = game;
    if (!currentGame) {
      currentGame = await createNewGame();
      if (!currentGame) {
        setIsSending(false);
        Alert.alert("Error", "Failed to create a new game. Please try again.");
        return;
      }
      setGame(currentGame);
    }

    const userChatMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    // Update local state immediately for responsiveness
    const updatedHistory = [...(currentGame.chatHistory || []), userChatMessage];
    setGame((prev) => 
      prev ? { ...prev, chatHistory: updatedHistory } : { ...currentGame, chatHistory: updatedHistory }
    );

    try {
      // STEP 1: Save user message to database first (persist before calling Vellum)
      await apiRequest("PUT", `/api/custom-games/${currentGame.id}`, {
        chatHistory: updatedHistory,
      });

      // STEP 2: Call Vellum (non-streaming endpoint that buffers response)
      const response = await fetch(
        new URL("/api/vellum/chat", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            gameId: currentGame.id,
            message: userMessage,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        // Create error message with executionId if available (so admin can debug)
        const isAdmin = user?.isAdmin === true;
        let errorContent = result.error || `Request failed (${response.status})`;
        
        // Show detailed error info to admins
        if (isAdmin) {
          const details: string[] = [];
          if (result.state) details.push(`State: ${result.state}`);
          if (result.executionId) details.push(`Execution: ${result.executionId}`);
          if (result.details) details.push(`Details: ${result.details}`);
          if (details.length > 0) {
            errorContent = `${errorContent}\n\n[Admin Debug]\n${details.join('\n')}`;
          }
        }
        
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorContent}`,
          timestamp: Date.now(),
          executionId: result.executionId || undefined,
        };
        
        const errorHistory = [...updatedHistory, errorMessage];
        setGame((prev) =>
          prev ? { ...prev, chatHistory: errorHistory } : prev
        );
        
        // Save error message to database
        try {
          await apiRequest("PUT", `/api/custom-games/${currentGame.id}`, {
            chatHistory: errorHistory,
          });
        } catch {
          // Ignore secondary error
        }
        return;
      }

      // STEP 3: Reload game to get updated state (Vellum may have updated artifacts)
      await loadGame(currentGame.id);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorContent = error instanceof Error ? error.message : "Unknown error";
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: `Error: Failed to connect to AI service. ${errorContent}`,
        timestamp: Date.now(),
      };
      
      // Add error message to existing history (which includes the user message)
      const errorHistory = [...updatedHistory, errorMessage];
      setGame((prev) =>
        prev ? { ...prev, chatHistory: errorHistory } : prev
      );
      
      // Save error message to database too
      try {
        await apiRequest("PUT", `/api/custom-games/${currentGame.id}`, {
          chatHistory: errorHistory,
        });
      } catch {
        // Ignore secondary error
      }
    } finally {
      setIsSending(false);
    }
  };

  const openVellumExecution = (executionId: string) => {
    const url = `https://app.vellum.ai/workflows/executions/${executionId}`;
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open Vellum execution:", err);
    });
  };

  const TypingIndicator = () => {
    const dot1Opacity = useSharedValue(0.3);
    const dot2Opacity = useSharedValue(0.3);
    const dot3Opacity = useSharedValue(0.3);

    React.useEffect(() => {
      dot1Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      );
      dot2Opacity.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1
        )
      );
      dot3Opacity.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1
        )
      );
    }, []);

    const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
    const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
    const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

    return (
      <Animated.View entering={FadeInDown.springify()} style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, dot1Style]} />
          <Animated.View style={[styles.typingDot, dot2Style]} />
          <Animated.View style={[styles.typingDot, dot3Style]} />
        </View>
      </Animated.View>
    );
  };

  const copyVellumLink = async (executionId: string) => {
    const url = `https://app.vellum.ai/workflows/executions/${executionId}`;
    await Clipboard.setStringAsync(url);
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => {
    const isAdmin = user?.isAdmin === true;
    const hasExecutionId = item.role === "assistant" && item.executionId;
    
    const tripleTapGesture = Gesture.Tap()
      .numberOfTaps(3)
      .onEnd(() => {
        if (isAdmin && hasExecutionId && item.executionId) {
          scheduleOnRN(Haptics.notificationAsync, Haptics.NotificationFeedbackType.Success);
          scheduleOnRN(openVellumExecution, item.executionId);
        }
      });

    const longPressGesture = Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        if (isAdmin && hasExecutionId && item.executionId) {
          scheduleOnRN(Haptics.notificationAsync, Haptics.NotificationFeedbackType.Success);
          scheduleOnRN(copyVellumLink, item.executionId);
        }
      });

    const combinedGesture = Gesture.Race(tripleTapGesture, longPressGesture);

    const messageContent = (
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.messageContainer,
          item.role === "user" ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.role === "user"
              ? { backgroundColor: Colors.dark.primary }
              : { backgroundColor: Colors.dark.backgroundSecondary },
          ]}
        >
          <ThemedText type="body" style={styles.messageText} selectable>
            {item.content}
          </ThemedText>
        </View>
      </Animated.View>
    );

    if (isAdmin && hasExecutionId) {
      return (
        <GestureDetector gesture={combinedGesture}>
          {messageContent}
        </GestureDetector>
      );
    }

    return messageContent;
  };

  const renderChatTab = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={game?.chatHistory || []}
        keyExtractor={(item) => item.id}
        renderItem={renderChatMessage}
        contentContainerStyle={[
          styles.chatList,
          { paddingBottom: Spacing.lg },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={styles.aiIcon}>
              <Feather name="cpu" size={32} color={Colors.dark.secondary} />
            </View>
            <ThemedText type="h4" style={styles.emptyTitle}>
              Game Studio AI
            </ThemedText>
            <ThemedText type="body" style={styles.emptySubtitle}>
              Tell me what kind of game you want to create!
            </ThemedText>
            <View style={styles.suggestions}>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => setMessage("Create a word guessing game")}
              >
                <ThemedText type="small" style={styles.suggestionText}>
                  Word guessing game
                </ThemedText>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => setMessage("Make a trivia game about movies")}
              >
                <ThemedText type="small" style={styles.suggestionText}>
                  Movie trivia
                </ThemedText>
              </Pressable>
              <Pressable
                style={styles.suggestionChip}
                onPress={() => setMessage("Create a speed typing challenge")}
              >
                <ThemedText type="small" style={styles.suggestionText}>
                  Speed typing
                </ThemedText>
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={isSending ? <TypingIndicator /> : null}
        onContentSizeChange={() => {
          if (game?.chatHistory?.length || isSending) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Describe your game idea..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!message.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.dark.text} />
            ) : (
              <Feather name="send" size={20} color={Colors.dark.text} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderPreviewTab = () => (
    <ScrollView
      style={styles.previewContainer}
      contentContainerStyle={[styles.previewContent, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      <Animated.View entering={FadeIn.delay(100)} style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View style={styles.gameIcon}>
            <Feather name="zap" size={28} color={Colors.dark.secondary} />
          </View>
          <View style={styles.previewInfo}>
            <ThemedText type="h4">{game?.metadata.name || "New Game"}</ThemedText>
            <ThemedText type="small" style={styles.previewMeta}>
              {game?.metadata.duration}s | {game?.metadata.type}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="body" style={styles.previewDescription}>
          {game?.metadata.description || "A custom mini-game"}
        </ThemedText>

        <View style={styles.rulesSection}>
          <ThemedText type="subheading" style={styles.rulesTitle}>
            How to Play
          </ThemedText>
          {game?.metadata.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <View style={styles.ruleNumber}>
                <ThemedText type="caption" style={styles.ruleNumberText}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText type="body" style={styles.ruleText}>
                {rule}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.previewActions}>
          <Pressable style={styles.testButton}>
            <Feather name="play" size={18} color={Colors.dark.text} />
            <ThemedText type="body" style={styles.testButtonText}>
              Test Game
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderCodeTab = () => (
    <View style={styles.codeContainer}>
      <View style={styles.codeTabBar}>
        <Pressable
          style={[styles.codeTabButton, codeTab === "metadata" && styles.codeTabButtonActive]}
          onPress={() => setCodeTab("metadata")}
        >
          <ThemedText
            type="small"
            style={[styles.codeTabText, codeTab === "metadata" && styles.codeTabTextActive]}
          >
            metadata.json
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.codeTabButton, codeTab === "logic" && styles.codeTabButtonActive]}
          onPress={() => setCodeTab("logic")}
        >
          <ThemedText
            type="small"
            style={[styles.codeTabText, codeTab === "logic" && styles.codeTabTextActive]}
          >
            logic.lua
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.codeScrollView}
        contentContainerStyle={[styles.codeContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        horizontal={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <ThemedText type="caption" style={styles.codeText}>
            {codeTab === "metadata"
              ? JSON.stringify(game?.metadata || {}, null, 2)
              : game?.logicLua || ""}
          </ThemedText>
        </ScrollView>
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText type="body" style={styles.loadingText}>
          Loading game studio...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabBar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.tabButtons}>
          {(["chat", "preview", "code"] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Feather
                name={tab === "chat" ? "message-circle" : tab === "preview" ? "play-circle" : "code"}
                size={20}
                color={activeTab === tab ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <ThemedText
                type="small"
                style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "preview" && renderPreviewTab()}
        {activeTab === "code" && renderCodeTab()}
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
  loadingText: {
    marginTop: Spacing.lg,
    color: Colors.dark.textSecondary,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
  },
  tabButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  tabButtonText: {
    color: Colors.dark.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.dark.primary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatList: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
  },
  aiIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  suggestionChip: {
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundTertiary,
  },
  suggestionText: {
    color: Colors.dark.text,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  assistantMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    color: Colors.dark.text,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    padding: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewMeta: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  previewDescription: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
  },
  rulesSection: {
    marginBottom: Spacing.xl,
  },
  rulesTitle: {
    marginBottom: Spacing.md,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  ruleNumberText: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  ruleText: {
    flex: 1,
    color: Colors.dark.textSecondary,
  },
  previewActions: {
    alignItems: "center",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  testButtonText: {
    fontWeight: "600",
  },
  codeContainer: {
    flex: 1,
  },
  codeTabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
  },
  codeTabButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  codeTabButtonActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  codeTabText: {
    color: Colors.dark.textSecondary,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  codeTabTextActive: {
    color: Colors.dark.secondary,
  },
  codeScrollView: {
    flex: 1,
  },
  codeContent: {
    padding: Spacing.lg,
  },
  codeText: {
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  typingContainer: {
    alignSelf: "flex-start",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.textSecondary,
  },
});
