import React, { useEffect, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { useStore } from "../store/useStore";
import { authService } from "../services/auth";
import apiService from "../services/api";

// Custom dark theme matching our design system
const BlindlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0B0B10",
    card: "#121218",
    border: "#16161B",
    primary: "#7C3AED",
    text: "#E6E6F0",
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const {
    isAuthenticated,
    isLoading,
    isOnboardingComplete,
    setAuthLoading,
    login,
    accessToken,
  } = useStore();

  // Memoized login handler
  const handleLogin = useCallback(
    (user: Parameters<typeof login>[0], token: string) => {
      login(user, token);
    },
    [login],
  );

  // Restore session on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await authService.restoreSession();

        if (result.success && result.user && result.tokens) {
          const userProfile = {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName || "User",
            lastName: result.user.lastName || "",
            bio: "",
            hobbies: [],
            personalityTraits: {},
            photos: result.user.profilePictureUrl
              ? [result.user.profilePictureUrl]
              : [],
            isVerified: false,
            isPhotosRevealed: false,
          };

          handleLogin(userProfile, result.tokens.accessToken);
          apiService.setToken(result.tokens.accessToken);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, [handleLogin, setAuthLoading]);

  // Set API token when access token changes
  useEffect(() => {
    if (accessToken) {
      apiService.setToken(accessToken);
    }
  }, [accessToken]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to auth if not authenticated
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect based on onboarding status
      if (isOnboardingComplete) {
        router.replace("/(tabs)/swipe" as Href);
      } else {
        // Continue with onboarding - they might be on hobbies/personality
        const currentScreen = segments[1];
        if (!currentScreen || currentScreen === "welcome") {
          router.replace("/(auth)/hobbies");
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, isOnboardingComplete, router]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="maytri-history"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={BlindlyDarkTheme}>
        <RootLayoutNav />
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
