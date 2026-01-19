import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const buttonScale = useSharedValue(1);

  const handleLogin = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(username.trim());
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <LinearGradient
      colors={[Colors.dark.backgroundRoot, Colors.dark.backgroundDefault]}
      style={styles.container}
    >
      <Pressable style={styles.container} onPress={dismissKeyboard}>
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing["4xl"],
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText type="display" style={styles.title}>
              Squad Party
            </ThemedText>
            <ThemedText type="body" style={styles.subtitle}>
              Challenge your friends in fast-paced mini-games
            </ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor={Colors.dark.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                testID="input-username"
              />
            </View>

            <AnimatedPressable
              style={[styles.primaryButton, buttonAnimatedStyle]}
              onPress={handleLogin}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
              }}
              disabled={!username.trim() || isLoading}
              testID="button-login"
            >
              <LinearGradient
                colors={[Colors.dark.primary, "#FF5252"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText type="subheading" style={styles.buttonText}>
                    Get Started
                  </ThemedText>
                )}
              </LinearGradient>
            </AnimatedPressable>

            <ThemedText type="caption" style={styles.disclaimer}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </ThemedText>
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: Spacing["5xl"],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  title: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  primaryButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  buttonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disclaimer: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
