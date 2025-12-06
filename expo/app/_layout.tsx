import React, { useEffect, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments, Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import "../global.css";

import { useStore } from "../store/useStore";
import { graphqlAuthService } from "../services/graphql-auth";
import apiService from "../services/api";
import { setAccessToken as setGraphQLToken } from "../services/graphql-client";

// Custom dark theme matching our design system
const BlindlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0B0223",
    card: "#1D0F45",
    border: "rgba(255, 255, 255, 0.1)",
    primary: "#6A1BFF",
    text: "#FFFFFF",
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, setAuthLoading, login, accessToken } =
    useStore();

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
        const result = await graphqlAuthService.restoreSession();

        if (result.success && result.user) {
          const userProfile = {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || "User",
            lastName: result.user.last_name || "",
            bio: result.user.bio || "",
            hobbies: result.user.hobbies || [],
            personalityTraits: result.user.personality_traits
              ? Object.fromEntries(
                result.user.personality_traits.map((t) => [t.key, t.value]),
              )
              : {},
            photos: result.user.photos || [],
            isVerified: result.user.is_verified,
            isPhotosRevealed: false,
          };

          // Get the stored access token
          const storedToken = result.accessToken || accessToken;
          if (storedToken) {
            handleLogin(userProfile, storedToken);
            apiService.setToken(storedToken);
            await setGraphQLToken(storedToken);
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, [handleLogin, setAuthLoading, accessToken]);

  // Set API token when access token changes
  useEffect(() => {
    if (accessToken) {
      apiService.setToken(accessToken);
      setGraphQLToken(accessToken);
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
      // Check actual user data for onboarding status
      const checkAndNavigate = async () => {
        const storedUser = await graphqlAuthService.getStoredUser();
        if (storedUser) {
          const status = graphqlAuthService.getOnboardingStatus(storedUser);
          if (status.nextScreen) {
            // Only redirect if not already on an onboarding screen
            const currentScreen = segments[1];
            if (
              currentScreen === "welcome" ||
              currentScreen === "login" ||
              currentScreen === "signup" ||
              currentScreen === "verify-code" ||
              currentScreen === "email-login"
            ) {
              router.replace(status.nextScreen as Href);
            }
          } else {
            // Onboarding complete, go to main app
            router.replace("/(tabs)/swipe" as Href);
          }
        } else {
          // No user data, go to hobbies as fallback
          router.replace("/(auth)/hobbies" as Href);
        }
      };

      checkAndNavigate();
    }
  }, [isAuthenticated, isLoading, segments, router]);

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

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Lexend fonts
    "Lexend-Thin": require("../assets/fonts/Lexend/static/Lexend-Thin.ttf"),
    "Lexend-ExtraLight": require("../assets/fonts/Lexend/static/Lexend-ExtraLight.ttf"),
    "Lexend-Light": require("../assets/fonts/Lexend/static/Lexend-Light.ttf"),
    "Lexend-Regular": require("../assets/fonts/Lexend/static/Lexend-Regular.ttf"),
    "Lexend-Medium": require("../assets/fonts/Lexend/static/Lexend-Medium.ttf"),
    "Lexend-SemiBold": require("../assets/fonts/Lexend/static/Lexend-SemiBold.ttf"),
    "Lexend-Bold": require("../assets/fonts/Lexend/static/Lexend-Bold.ttf"),
    "Lexend-ExtraBold": require("../assets/fonts/Lexend/static/Lexend-ExtraBold.ttf"),
    "Lexend-Black": require("../assets/fonts/Lexend/static/Lexend-Black.ttf"),
    // Nunito fonts
    "Nunito-ExtraLight": require("../assets/fonts/Nunito/static/Nunito-ExtraLight.ttf"),
    "Nunito-Light": require("../assets/fonts/Nunito/static/Nunito-Light.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito/static/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito/static/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito/static/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito/static/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito/static/Nunito-ExtraBold.ttf"),
    "Nunito-Black": require("../assets/fonts/Nunito/static/Nunito-Black.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0223", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#6A1BFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={BlindlyDarkTheme}>
        <RootLayoutNav />
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
