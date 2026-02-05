import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, color, delay }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.statCard}
    >
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "20" }]}
      >
        <Feather name={icon} size={20} color={color} />
      </View>
      <ThemedText type="h3" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={styles.statLabel}>
        {label}
      </ThemedText>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, hasPassword, setPassword } = useAuth();

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (hasPassword && !currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    setIsChangingPassword(true);
    try {
      await setPassword(newPassword, hasPassword ? currentPassword : undefined);
      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.profileHeader}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/avatar-placeholder.png")}
            style={styles.avatar}
          />
          <View style={styles.avatarBadge}>
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </View>
        </View>
        <ThemedText type="h2" style={styles.username}>
          {user.username}
        </ThemedText>
        <ThemedText type="body" style={styles.memberSince}>
          Squad Party Member
        </ThemedText>
      </Animated.View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="play-circle"
          label="Games Played"
          value={user.gamesPlayed}
          color={Colors.dark.primary}
          delay={200}
        />
        <StatCard
          icon="award"
          label="Wins"
          value={user.wins}
          color={Colors.dark.gold}
          delay={300}
        />
        <StatCard
          icon="trending-up"
          label="Top Rank"
          value={user.topRank > 0 ? `#${user.topRank}` : "-"}
          color={Colors.dark.secondary}
          delay={400}
        />
      </View>

      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={styles.achievementsSection}
      >
        <ThemedText type="h4" style={styles.sectionTitle}>
          Recent Activity
        </ThemedText>
        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Feather name="clock" size={20} color={Colors.dark.textSecondary} />
          </View>
          <View style={styles.activityContent}>
            <ThemedText type="body" style={styles.activityText}>
              No recent activity yet
            </ThemedText>
            <ThemedText type="caption" style={styles.activitySubtext}>
              Start playing to see your activity here
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={styles.securitySection}
      >
        <ThemedText type="h4" style={styles.sectionTitle}>
          Security
        </ThemedText>

        {passwordSuccess ? (
          <View style={styles.successMessage}>
            <Feather
              name="check-circle"
              size={16}
              color={Colors.dark.success}
            />
            <ThemedText type="body" style={styles.successText}>
              {passwordSuccess}
            </ThemedText>
          </View>
        ) : null}

        {showPasswordSection ? (
          <View style={styles.passwordForm}>
            {hasPassword ? (
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Current password"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  testID="input-current-password"
                />
              </View>
            ) : null}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New password"
                placeholderTextColor={Colors.dark.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                testID="input-new-password"
              />
            </View>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.dark.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                testID="input-confirm-password"
              />
            </View>

            {passwordError ? (
              <ThemedText type="body" style={styles.errorText}>
                {passwordError}
              </ThemedText>
            ) : null}

            <View style={styles.passwordButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.saveButton,
                  isChangingPassword && styles.disabledButton,
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText type="body" style={styles.saveButtonText}>
                    Save
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.securityCard}
            onPress={() => setShowPasswordSection(true)}
          >
            <View style={styles.activityIcon}>
              <Feather name="lock" size={20} color={Colors.dark.primary} />
            </View>
            <View style={styles.activityContent}>
              <ThemedText type="body" style={styles.activityText}>
                {hasPassword ? "Change Password" : "Set Password"}
              </ThemedText>
              <ThemedText type="caption" style={styles.activitySubtext}>
                {hasPassword
                  ? "Update your account password"
                  : "Protect your account with a password"}
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors.dark.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 4,
    borderColor: Colors.dark.primary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.dark.backgroundRoot,
  },
  username: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  memberSince: {
    color: Colors.dark.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing["3xl"],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  achievementsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  activitySubtext: {
    color: Colors.dark.textSecondary,
  },
  securitySection: {
    marginBottom: Spacing.xl,
  },
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  passwordForm: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  passwordInputContainer: {
    marginBottom: Spacing.md,
  },
  passwordInput: {
    height: 48,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark.text,
  },
  errorText: {
    color: Colors.dark.error,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.success + "20",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    color: Colors.dark.success,
  },
  passwordButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelButtonText: {
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
