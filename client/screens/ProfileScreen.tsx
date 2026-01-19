import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

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
      <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
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
  const { user } = useAuth();

  if (!user) return null;

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
});
