import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Sparkles, Mail, Shield } from "lucide-react-native";
import { authService } from "../../services/auth";
import { useStore } from "../../store/useStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const { login, setAuthLoading } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    setAuthLoading(true);

    try {
      const result = await authService.signInWithSSO();

      if (result.success && result.user && result.tokens) {
        // Transform WorkOS user to app UserProfile
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

        login(userProfile, result.tokens.accessToken);

        // Navigate to onboarding or main app
        router.replace("/(auth)/hobbies" as Href);
      } else {
        // Handle auth failure
        if (result.error !== "Authentication cancelled") {
          Alert.alert(
            "Authentication Failed",
            result.error || "Please try again",
          );
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert(
        "Authentication Error",
        "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    // Same flow for sign in - WorkOS handles both
    await handleGetStarted();
  };

  const handleDemoMode = () => {
    // For development/demo purposes - skip auth
    const demoUser = {
      id: "demo-user",
      email: "demo@blindly.app",
      firstName: "Demo",
      lastName: "User",
      bio: "Just exploring Blindly!",
      hobbies: ["Music", "Travel"],
      personalityTraits: { Chill: 5, Creative: 4 },
      photos: [],
      isVerified: false,
      isPhotosRevealed: false,
    };

    login(demoUser, "demo-token");
    router.replace("/(tabs)/swipe" as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-between py-12">
        {/* Top Section: Branding */}
        <View className="items-center mt-10">
          <Image
            source={require("../../assets/main-trans.png")}
            style={{ width: 80, height: 40 }}
          />
          <Typography variant="body" color="muted" className="mt-2">
            Connection beyond appearances
          </Typography>
        </View>

        {/* Middle Section: Hero Copy */}
        <View className="items-center space-y-4">
          <Typography
            variant="h1"
            className="text-center text-3xl leading-tight"
          >
            Meet the person first.{"\n"}
            <Typography variant="h1" color="primary" className="text-3xl">
              Looks later.
            </Typography>
          </Typography>

          <Typography
            variant="body"
            color="muted"
            className="text-center px-4 mt-4 leading-relaxed"
          >
            Connect deeply through hobbies and personality. Photos are revealed
            only when you both feel ready.
          </Typography>

          {/* Feature Highlights */}
          <View className="mt-8 space-y-3 w-full">
            <View className="flex-row items-center bg-surface-elevated rounded-xl p-4">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Shield size={20} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Typography variant="label">Privacy First</Typography>
                <Typography variant="caption" color="muted">
                  Your photos stay hidden until you choose to reveal
                </Typography>
              </View>
            </View>

            <View className="flex-row items-center bg-surface-elevated rounded-xl p-4 top-2">
              <View className="w-10 h-10 rounded-full bg-ai/20 items-center justify-center mr-3">
                <Sparkles size={20} color="#FFD166" />
              </View>
              <View className="flex-1">
                <Typography variant="label">AI-Powered Matching</Typography>
                <Typography variant="caption" color="muted">
                  Smart recommendations based on personality
                </Typography>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Section: Actions */}
        <View className="space-y-4 w-full mb-4">
          <Button
            variant="primary"
            size="lg"
            onPress={handleGetStarted}
            disabled={isLoading}
            className="w-full"
            icon={
              isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Mail size={20} color="#FFFFFF" />
              )
            }
          >
            {isLoading ? "Connecting..." : "Get Started"}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onPress={handleSignIn}
            disabled={isLoading}
            className="w-full top-4"
          >
            I already have an account
          </Button>

          {/* Demo mode for development */}
          {__DEV__ && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleDemoMode}
              className="w-full mt-2 top-4"
            >
              <Typography variant="caption" color="muted">
                Skip to Demo
              </Typography>
            </Button>
          )}

          <Typography
            variant="caption"
            color="muted"
            className="text-center mt-6 opacity-60 top-6"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </View>
      </View>
    </SafeAreaView>
  );
}
