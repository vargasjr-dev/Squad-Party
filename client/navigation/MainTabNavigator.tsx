import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import PlayStackNavigator from "@/navigation/PlayStackNavigator";
import PlaylistsStackNavigator from "@/navigation/PlaylistsStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  PlayTab: undefined;
  PlaylistsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function FloatingActionButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    navigation.navigate("HostSession");
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <Animated.View style={[styles.fabContainer, animatedStyle]}>
      <Pressable
        style={styles.fab}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID="button-host"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="PlayTab"
        screenOptions={{
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundRoot,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
          tabBarLabelStyle: {
            fontFamily: "Poppins_500Medium",
            fontSize: 12,
          },
        }}
      >
        <Tab.Screen
          name="PlayTab"
          component={PlayStackNavigator}
          options={{
            title: "Play",
            tabBarIcon: ({ color, size }) => (
              <Feather name="play-circle" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="PlaylistsTab"
          component={PlaylistsStackNavigator}
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, size }) => (
              <Feather name="list" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    bottom: 90,
    right: Spacing.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
