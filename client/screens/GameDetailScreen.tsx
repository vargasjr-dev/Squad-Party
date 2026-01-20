import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "word":
      return "Word Game";
    case "trivia":
      return "Trivia";
    case "speed":
      return "Speed Challenge";
    case "memory":
      return "Memory Game";
    default:
      return "Mini Game";
  }
};

export default function GameDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "GameDetail">>();
  const { miniGames } = useGame();

  const game = miniGames.find((g) => g.id === route.params.gameId);

  if (!game) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={styles.notFoundText}>
          Game not found
        </ThemedText>
      </View>
    );
  }

  const handlePlaySolo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("SoloGamePlay", { gameId: game.id });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Feather
              name={getTypeIcon(game.type)}
              size={48}
              color={Colors.dark.secondary}
            />
          </View>
          <ThemedText type="h2" style={styles.gameName}>
            {game.name}
          </ThemedText>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={16} color={Colors.dark.textSecondary} />
              <ThemedText type="body" style={styles.metaText}>
                {game.duration}s
              </ThemedText>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Feather name="tag" size={16} color={Colors.dark.textSecondary} />
              <ThemedText type="body" style={styles.metaText}>
                {getTypeLabel(game.type)}
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Description
          </ThemedText>
          <ThemedText type="body" style={styles.description}>
            {game.description}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Created By
          </ThemedText>
          <View style={styles.creatorCard}>
            <View style={styles.creatorAvatar}>
              <Feather name="user" size={20} color={Colors.dark.primary} />
            </View>
            <ThemedText type="body" style={styles.creatorName}>
              {game.creatorName}
            </ThemedText>
            {game.isDefault ? (
              <View style={styles.officialBadge}>
                <Feather name="check-circle" size={12} color={Colors.dark.secondary} />
                <ThemedText type="caption" style={styles.officialText}>
                  Official
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            How to Play
          </ThemedText>
          <View style={styles.rulesContainer}>
            {game.rules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <View style={styles.ruleNumber}>
                  <ThemedText type="small" style={styles.ruleNumberText}>
                    {index + 1}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={styles.ruleText}>
                  {rule}
                </ThemedText>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(400).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <Button onPress={handlePlaySolo} variant="primary">
          <ThemedText type="body" style={{ color: Colors.dark.backgroundRoot }}>
            Play Solo
          </ThemedText>
        </Button>
      </Animated.View>
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
  notFoundText: {
    color: Colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  gameName: {
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.dark.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.dark.textSecondary,
    lineHeight: 24,
  },
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  creatorName: {
    color: Colors.dark.text,
    flex: 1,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundRoot,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  officialText: {
    color: Colors.dark.secondary,
  },
  rulesContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  ruleNumberText: {
    color: Colors.dark.backgroundRoot,
    fontWeight: "600",
  },
  ruleText: {
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.dark.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundSecondary,
  },
});
