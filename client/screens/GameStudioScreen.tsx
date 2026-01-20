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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";

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
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [codeTab, setCodeTab] = useState<"metadata" | "logic">("metadata");
  const flatListRef = useRef<FlatList>(null);

  const gameId = route.params?.gameId;

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    if (!gameId) return;
    
    try {
      setIsLoading(true);
      const res = await apiRequest("GET", `/api/custom-games/${gameId}`);
      const gameData = await res.json();
      setGame(gameData);
    } catch (error) {
      console.error("Failed to load game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !game || !user || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);

    const userMessage = message.trim();
    setMessage("");

    const tempUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };

    setGame((prev) => 
      prev ? { ...prev, chatHistory: [...prev.chatHistory, tempUserMessage] } : prev
    );

    try {
      const response = await fetch(`${getApiUrl()}/api/vellum/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          gameId: game.id,
          message: userMessage,
        }),
      });

      let fullResponse = "";
      const reader = response.body?.getReader();
      
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      await loadGame();
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setGame((prev) =>
        prev ? { ...prev, chatHistory: [...prev.chatHistory, errorMessage] } : prev
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
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
        <ThemedText type="body" style={styles.messageText}>
          {item.content}
        </ThemedText>
      </View>
    </Animated.View>
  );

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
        onContentSizeChange={() => {
          if (game?.chatHistory?.length) {
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
});
