import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
}

function SettingsItem({
  icon,
  label,
  onPress,
  color = Colors.dark.text,
  showChevron = true,
}: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.settingsIcon, { backgroundColor: color + "20" }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <ThemedText type="body" style={[styles.settingsLabel, { color }]}>
          {label}
        </ThemedText>
      </View>
      {showChevron ? (
        <Feather
          name="chevron-right"
          size={20}
          color={Colors.dark.textSecondary}
        />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "All your data will be permanently deleted. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <ThemedText type="caption" style={styles.sectionHeader}>
          ACCOUNT
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="user"
            label="Edit Profile"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="bell"
            label="Notifications"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <ThemedText type="caption" style={styles.sectionHeader}>
          PREFERENCES
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="volume-2"
            label="Sound Effects"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="smartphone"
            label="Haptic Feedback"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <ThemedText type="caption" style={styles.sectionHeader}>
          ABOUT
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="info"
            label="About Squad Party"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="book"
            label="Terms of Service"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()}>
        <ThemedText type="caption" style={styles.sectionHeader}>
          DANGER ZONE
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="log-out"
            label="Log Out"
            onPress={handleLogout}
            color={Colors.dark.primary}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="trash-2"
            label="Delete Account"
            onPress={handleDeleteAccount}
            color={Colors.dark.error}
            showChevron={false}
          />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <ThemedText type="caption" style={styles.versionText}>
          Squad Party v1.0.0
        </ThemedText>
        <ThemedText type="caption" style={styles.footerText}>
          Made with love for game nights
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    marginLeft: Spacing.sm,
    letterSpacing: 1,
  },
  section: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  settingsItemPressed: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingsLabel: {
    color: Colors.dark.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.xl,
  },
  versionText: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  footerText: {
    color: Colors.dark.textSecondary,
  },
});
