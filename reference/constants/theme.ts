import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#B4B4B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#B4B4B8",
    tabIconSelected: "#FF6B6B",
    link: "#FF6B6B",
    primary: "#FF6B6B",
    secondary: "#FFD93D",
    backgroundRoot: "#1A1A2E",
    backgroundDefault: "#16213E",
    backgroundSecondary: "#1F2B47",
    backgroundTertiary: "#283550",
    success: "#FFD700",
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    error: "#DC143C",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B4B4B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#B4B4B8",
    tabIconSelected: "#FF6B6B",
    link: "#FF6B6B",
    primary: "#FF6B6B",
    secondary: "#FFD93D",
    backgroundRoot: "#1A1A2E",
    backgroundDefault: "#16213E",
    backgroundSecondary: "#1F2B47",
    backgroundTertiary: "#283550",
    success: "#FFD700",
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    error: "#DC143C",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Poppins_700Bold",
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Poppins_700Bold",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "Poppins_700Bold",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Poppins_600SemiBold",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
    fontFamily: "Poppins_600SemiBold",
  },
  subheading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "500" as const,
    fontFamily: "Poppins_500Medium",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Poppins_400Regular",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Poppins_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Poppins_400Regular",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Poppins_400Regular",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Poppins_400Regular",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Poppins_400Regular",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
