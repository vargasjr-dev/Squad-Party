import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useGame, MiniGame } from "@/contexts/GameContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GameCardProps {
  game: MiniGame;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

function GameCard({ game, isSelected, onToggle, index }: GameCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        style={[
          styles.gameCard,
          isSelected && styles.gameCardSelected,
          animatedStyle,
        ]}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        }}
        onPress={onToggle}
        testID={`card-game-${game.id}`}
      >
        <View style={styles.gameCardContent}>
          <View style={styles.gameIcon}>
            <Feather
              name={getTypeIcon(game.type)}
              size={20}
              color={Colors.dark.secondary}
            />
          </View>
          <View style={styles.gameInfo}>
            <ThemedText type="subheading" style={styles.gameName}>
              {game.name}
            </ThemedText>
            <ThemedText type="caption" style={styles.gameDescription}>
              {game.description}
            </ThemedText>
            <View style={styles.gameMeta}>
              <View style={styles.metaItem}>
                <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
                <ThemedText type="caption" style={styles.metaText}>
                  {game.duration}s
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <Feather name="tag" size={12} color={Colors.dark.textSecondary} />
                <ThemedText type="caption" style={styles.metaText}>
                  {game.type}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected ? (
            <Feather name="check" size={16} color="#FFFFFF" />
          ) : null}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CreatePlaylistScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CreatePlaylist">>();
  const { miniGames, createPlaylist, updatePlaylist } = useGame();

  const existingPlaylist = route.params?.playlist;
  const [name, setName] = useState(existingPlaylist?.name || "");
  const [description, setDescription] = useState(existingPlaylist?.description || "");
  const [selectedGames, setSelectedGames] = useState<string[]>(
    existingPlaylist?.games || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggleGame = (gameId: string) => {
    Haptics.selectionAsync();
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || selectedGames.length === 0) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (existingPlaylist) {
        await updatePlaylist(existingPlaylist.id, {
          name: name.trim(),
          description: description.trim(),
          games: selectedGames,
        });
      } else if (user) {
        await createPlaylist(name.trim(), description.trim(), selectedGames, user.id);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save playlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim().length > 0 && selectedGames.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl + 100,
          },
        ]}
        data={miniGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <GameCard
            game={item}
            isSelected={selectedGames.includes(item.id)}
            onToggle={() => toggleGame(item.id)}
            index={index}
          />
        )}
        ListHeaderComponent={
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.inputLabel}>
                Playlist Name
              </ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter playlist name..."
                placeholderTextColor={Colors.dark.textSecondary}
                testID="input-playlist-name"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.inputLabel}>
                Description (optional)
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                placeholderTextColor={Colors.dark.textSecondary}
                multiline
                numberOfLines={3}
                testID="input-playlist-description"
              />
            </View>

            <ThemedText type="h4" style={styles.sectionTitle}>
              Select Games ({selectedGames.length} selected)
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          onPress={handleSave}
          disabled={!isValid || isLoading}
          style={styles.saveButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : existingPlaylist ? (
            "Save Changes"
          ) : (
            "Create Playlist"
          )}
        </Button>
      </View>
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
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  sectionTitle: {
    color: Colors.dark.text,
    marginTop: Spacing.lg,
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  gameCardSelected: {
    borderColor: Colors.dark.primary,
  },
  gameCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  gameIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  gameDescription: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  gameMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    color: Colors.dark.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  separator: {
    height: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.dark.backgroundRoot,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundDefault,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
  },
});
