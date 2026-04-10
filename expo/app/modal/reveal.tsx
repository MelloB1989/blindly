import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import { RatingSlider } from "../../components/rating/RatingSlider";
import { AlertTriangle, Sparkles, EyeOff, Eye } from "lucide-react-native";
import { chatService } from "../../services/chat-service";
import { useStore } from "../../store/useStore";
import * as Haptics from "expo-haptics";

export default function RevealModal() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useStore();

  const [step, setStep] = useState<"loading" | "animating" | "rating">("loading");
  const [rating, setRating] = useState<number>(0);
  const [profile, setProfile] = useState<{
    name: string;
    photo: string;
  } | null>(null);

  // Animation Values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const blurOpacity = useSharedValue(1);

  // Fetch actual connection data
  useEffect(() => {
    const fetchConnection = async () => {
      if (!chatId) {
        router.back();
        return;
      }

      try {
        const result = await chatService.getMyConnections();
        if (result.success && result.connections) {
          const conn = result.connections.find((c) => c.chat.id === chatId);
          if (conn && conn.match.is_unlocked) {
            setProfile({
              name: conn.connection_profile.name,
              photo: conn.connection_profile.photos?.[0] || conn.connection_profile.pfp,
            });
            setStep("animating");
            startRevealAnimation();
          } else {
            Alert.alert("Not Ready", "This match hasn't been unlocked yet.");
            router.back();
          }
        }
      } catch (error) {
        console.error("Failed to fetch connection:", error);
        router.back();
      }
    };
    fetchConnection();
  }, [chatId]);

  const startRevealAnimation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      blurOpacity.value = withTiming(0, { duration: 1200 });
      opacity.value = withTiming(1, { duration: 1200 });
      scale.value = withSpring(1, { damping: 12 });

      setTimeout(() => {
        setStep("rating");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500);
    }, 600);
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const handleRating = (score: number) => {
    setRating(score);
    if (score >= 8) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Select a Rating", "Please select a rating from 1-10 before submitting.");
      return;
    }

    // Navigate to the rating modal which handles the full rating flow
    router.replace({
      pathname: "/modal/rating",
      params: { chatId },
    });
  };

  if (step === "loading") {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8A3CFF" />
          <Typography variant="body" className="mt-4 text-white/50">
            Preparing reveal...
          </Typography>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View className="flex-1 items-center justify-center px-6">
        {/* Reveal Area */}
        <View className="items-center mb-10 relative">
          <View
            className="items-center justify-center overflow-hidden"
            style={styles.revealCircle}
          >
            {/* The Revealed Image */}
            <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
              {profile?.photo && (
                <Image
                  source={{ uri: profile.photo }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
            </Animated.View>

            {/* The "Locked" Overlay (fading out) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.lockOverlay,
                animatedBlurStyle,
              ]}
            >
              <EyeOff size={40} color="rgba(167,139,250,0.5)" />
            </Animated.View>
          </View>

          <View className="mt-6 items-center h-20">
            <Typography variant="h1" className="mb-2 text-3xl text-white">
              {step === "animating" ? "Revealing..." : `${profile?.name || "Match"}!`}
            </Typography>
            {step === "rating" && (
              <View className="flex-row items-center">
                <Eye size={14} color="#A78BFA" />
                <Typography variant="body" color="muted" className="text-center ml-1.5">
                  Photos are now unlocked!
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Rating Section */}
        {step === "rating" && (
          <Animated.View entering={FadeInUp.duration(600)} className="w-full">
            <View
              className="rounded-2xl p-5 mb-4 border"
              style={{
                backgroundColor: "rgba(26,1,56,0.8)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View className="flex-row items-center justify-center mb-2">
                <Sparkles size={16} color="#FFD166" />
                <Typography variant="h3" className="text-white ml-2">
                  Rate to continue
                </Typography>
              </View>
              <Typography variant="caption" className="text-white/40 text-center mb-4">
                If you both rate 8+, it becomes a Date!
              </Typography>

              <RatingSlider
                value={rating}
                onChange={handleRating}
              />
            </View>

            <Button
              variant="primary"
              size="lg"
              className="w-full mb-4"
              disabled={rating === 0}
              onPress={handleSubmit}
            >
              Submit Rating
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              icon={<AlertTriangle size={16} color="#EF4444" />}
              onPress={() => {
                Alert.alert("Report", "This profile will be reviewed by our team.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Report", style: "destructive", onPress: () => router.back() },
                ]);
              }}
            >
              <Typography color="danger">Report Profile</Typography>
            </Button>
          </Animated.View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  revealCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#16161B",
    borderWidth: 4,
    borderColor: "rgba(124,58,237,0.3)",
  },
  lockOverlay: {
    backgroundColor: "#110827",
    alignItems: "center",
    justifyContent: "center",
  },
});
