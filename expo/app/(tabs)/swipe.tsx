import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  Pressable,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, Href } from "expo-router";
import Animated, { FadeOut, BounceIn } from "react-native-reanimated";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SwipeCard, SwipeCardProfile } from "../../components/ui/SwipeCard";
import { useStore } from "../../store/useStore";
import { swipeService, RecommendedProfile } from "../../services/swipe-service";
import {
  X,
  Heart,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Users,
  Calendar,
  Check,
  RefreshCw,
} from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Filter options
const AGE_RANGES = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-30", min: 25, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "40+", min: 40, max: 100 },
];

const DISTANCE_OPTIONS = [
  { label: "1 km", value: 1 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50+ km", value: 50 },
];

// Convert API profile to SwipeCardProfile
const toSwipeCardProfile = (rec: RecommendedProfile): SwipeCardProfile => {
  // Calculate age from DOB
  const dob = new Date(rec.profile.dob);
  const age = Math.floor(
    (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

  return {
    id: rec.profile.id,
    firstName: rec.profile.name.split(" ")[0],
    age,
    bio: rec.profile.bio,
    hobbies: rec.profile.hobbies,
    traits: rec.profile.personality_traits.map((t) => t.key),
    photos: rec.profile.photos,
    isRevealed: false, // Photos are blurred by default
    isVerified: rec.profile.is_verified,
    matchScore: Math.round(rec.match_score),
    distance: rec.distance_km
      ? rec.distance_km < 1
        ? "< 1 km"
        : `${Math.round(rec.distance_km)} km`
      : "Nearby",
    area: undefined, // Not in API
    languages: rec.profile.extra?.languages,
    zodiac: rec.profile.extra?.zodiac,
    lastActive: rec.profile.is_online ? "Online" : undefined,
    prompts: rec.profile.user_prompts.length > 0
      ? rec.profile.user_prompts.map((p, i) => ({
        question: `Prompt ${i + 1}`,
        answer: p,
      }))
      : undefined,
  };
};

export default function SwipeScreen() {
  const router = useRouter();
  const { profiles, currentIndex, swipeProfile, setProfiles, addProfiles } =
    useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [lastAction, setLastAction] = useState<{
    profile: SwipeCardProfile;
    action: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "like" | "pass" | "superlike";
    text: string;
  } | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [selectedAgeRange, setSelectedAgeRange] = useState<number | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(25);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Fetch recommendations from API
  const fetchRecommendations = useCallback(
    async (cursor?: string, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await swipeService.getRecommendations(cursor, 20);

        if (result.success && result.data) {
          const swipeProfiles = result.data.items.map(toSwipeCardProfile);

          if (append) {
            addProfiles(swipeProfiles);
          } else {
            setProfiles(swipeProfiles);
          }

          setNextCursor(result.data.next_cursor);
          setHasMore(result.data.has_more);
        } else {
          setError(result.error || "Failed to load profiles");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error("Fetch recommendations error:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [setProfiles, addProfiles],
  );

  // Initial load
  useEffect(() => {
    if (profiles.length === 0) {
      fetchRecommendations();
    }
  }, [profiles.length, fetchRecommendations]);

  // Load more when running low on profiles
  useEffect(() => {
    const remainingProfiles = profiles.length - currentIndex;
    if (remainingProfiles <= 3 && hasMore && !isLoadingMore && nextCursor) {
      fetchRecommendations(nextCursor, true);
    }
  }, [
    currentIndex,
    profiles.length,
    hasMore,
    isLoadingMore,
    nextCursor,
    fetchRecommendations,
  ]);

  const handleSwipeLeft = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Passed" });
      setFeedback({ type: "pass", text: "NOPE" });
      setTimeout(() => setFeedback(null), 800);

      // Update local state immediately
      swipeProfile("pass");

      // Submit to API
      const result = await swipeService.dislike(profile.id);
      if (!result.success) {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipeProfile],
  );

  const handleSwipeRight = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Liked" });
      setFeedback({ type: "like", text: "LIKE" });
      setTimeout(() => setFeedback(null), 800);

      // Update local state immediately
      swipeProfile("like");

      // Submit to API
      const result = await swipeService.like(profile.id);
      if (result.success && result.isMatch) {
        Alert.alert(
          "It's a Match! 🎉",
          `You and ${profile.firstName} liked each other! Start chatting to unlock photos.`,
          [
            {
              text: "Start Chatting",
              onPress: () => router.push("/(tabs)/chat" as Href),
            },
            { text: "Keep Swiping" },
          ],
        );
      } else if (!result.success) {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipeProfile, router],
  );

  const handleSwipeUp = useCallback(
    async (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Super Liked" });
      setFeedback({ type: "superlike", text: "SUPER LIKE" });
      setTimeout(() => setFeedback(null), 800);

      // Update local state immediately
      swipeProfile("superlike");

      // Submit to API
      const result = await swipeService.superlike(profile.id);
      if (result.success && result.isMatch) {
        Alert.alert(
          "Super Like Match! ⭐",
          `${profile.firstName} also likes you! You're now matched.`,
          [
            {
              text: "Start Chatting",
              onPress: () => router.push("/(tabs)/chat" as Href),
            },
            { text: "Keep Swiping" },
          ],
        );
      } else if (result.success) {
        Alert.alert(
          "Super Like Sent! ⭐",
          `${profile.firstName} will be notified that you super liked them!`,
        );
      } else {
        console.error("Failed to submit swipe:", result.error);
      }
    },
    [swipeProfile, router],
  );

  const handleShare = useCallback((profile: SwipeCardProfile) => {
    Alert.alert(
      "Share Profile",
      `Share ${profile.firstName}'s profile with a friend?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: () => {
            Alert.alert(
              "Shared!",
              `You've shared ${profile.firstName}'s profile link.`,
            );
          },
        },
      ],
    );
  }, []);

  const handleReport = useCallback((profile: SwipeCardProfile) => {
    const confirmReport = () => {
      Alert.alert(
        "Report Received",
        "Thank you for keeping our community safe. We will review this profile shortly.",
        [{ text: "OK" }],
      );
    };

    Alert.alert(
      "Report Profile",
      `Why are you reporting ${profile.firstName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Inappropriate Content",
          onPress: confirmReport,
        },
        {
          text: "Fake Profile",
          onPress: confirmReport,
        },
        {
          text: "Harassment",
          onPress: confirmReport,
        },
      ],
    );
  }, []);

  const handleAskAi = useCallback(
    (profile: SwipeCardProfile) => {
      router.push(`/(tabs)/maytri?profileName=${profile.firstName}` as Href);
    },
    [router],
  );

  const handleButtonSwipe = (direction: "left" | "right" | "up") => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    if (direction === "left") {
      handleSwipeLeft(currentProfile);
    } else if (direction === "right") {
      handleSwipeRight(currentProfile);
    } else {
      handleSwipeUp(currentProfile);
    }
  };

  const handleUndo = () => {
    if (lastAction) {
      Alert.alert(
        "Undo",
        `Undo ${lastAction.action.toLowerCase()} on ${lastAction.profile.firstName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Undo",
            onPress: () => {
              // TODO: Implement actual undo logic with API
              console.log("Undoing action on:", lastAction.profile.firstName);
              setLastAction(null);
            },
          },
        ],
      );
    } else {
      Alert.alert("Nothing to Undo", "You haven't swiped on anyone yet!");
    }
  };

  const handleRefresh = () => {
    setProfiles([]);
    setNextCursor(null);
    setHasMore(true);
    fetchRecommendations();
  };

  const applyFilters = () => {
    // TODO: Apply filters via API params
    console.log("Applying filters:", {
      ageRange: selectedAgeRange !== null ? AGE_RANGES[selectedAgeRange] : null,
      distance: selectedDistance,
      verifiedOnly: showVerifiedOnly,
    });
    setShowFilters(false);
    // Refetch with filters
    handleRefresh();
  };

  const resetFilters = () => {
    setSelectedAgeRange(null);
    setSelectedDistance(25);
    setShowVerifiedOnly(false);
  };

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const hasProfiles = visibleProfiles.length > 0;

  // Loading state
  if (isLoading && profiles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#7C3AED" />
        <Typography variant="body" color="muted" className="mt-4">
          Finding people for you...
        </Typography>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && profiles.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <StatusBar barStyle="light-content" />
        <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
          <X size={40} color="#EF4444" />
        </View>
        <Typography variant="h2" className="text-center mb-2">
          Something went wrong
        </Typography>
        <Typography variant="body" color="muted" className="text-center mb-6">
          {error}
        </Typography>
        <Button variant="primary" onPress={handleRefresh}>
          Try Again
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="px-4 py-3 flex-row justify-between items-center z-50">
        {/* Left placeholder for balance */}
        <View className="w-10" />

        {/* Centered Branding */}
        <View className="flex-row items-center gap-2">
          <Image
            source={require("../../assets/main-trans.png")}
            style={{ width: 80, height: 40 }}
          />
        </View>

        {/* Right Filter Button */}
        <Pressable
          onPress={() => setShowFilters(true)}
          className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center active:bg-surface"
        >
          <SlidersHorizontal size={20} color="#A6A6B2" />
        </Pressable>
      </View>

      {/* Card Stack */}
      <View
        className="flex-1 items-center justify-center my-2"
        style={{ height: SCREEN_HEIGHT * 0.65 }}
      >
        {/* Feedback Animation Overlay */}
        {feedback && (
          <View
            className="absolute inset-0 items-center justify-center z-50"
            pointerEvents="none"
          >
            <Animated.View
              entering={BounceIn.duration(500)}
              exiting={FadeOut.duration(300)}
              className={`px-10 py-6 border-8 rounded-3xl transform -rotate-12 ${feedback.type === "like"
                ? "border-success bg-success/20"
                : feedback.type === "pass"
                  ? "border-danger bg-danger/20"
                  : "border-primary bg-primary/20"
                }`}
            >
              <Typography
                variant="h1"
                className={`text-6xl font-black uppercase tracking-widest ${feedback.type === "like"
                  ? "text-success"
                  : feedback.type === "pass"
                    ? "text-danger"
                    : "text-primary"
                  }`}
              >
                {feedback.text}
              </Typography>
            </Animated.View>
          </View>
        )}

        {hasProfiles ? (
          <>
            {visibleProfiles
              .map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  index={index}
                  isFirst={index === 0}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onSwipeUp={handleSwipeUp}
                  onShare={handleShare}
                  onReport={handleReport}
                  onAskAi={handleAskAi}
                />
              ))
              .reverse()}
            {/* Loading more indicator */}
            {isLoadingMore && (
              <View className="absolute bottom-4">
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            )}
          </>
        ) : (
          <View className="items-center justify-center px-8">
            <View className="w-24 h-24 rounded-full bg-surface-elevated items-center justify-center mb-6">
              <Heart size={48} color="#7C3AED" />
            </View>
            <Typography variant="h2" className="text-center mb-2">
              {hasMore ? "Loading more..." : "No more profiles"}
            </Typography>
            <Typography
              variant="body"
              color="muted"
              className="text-center mb-6"
            >
              {hasMore
                ? "Finding more people for you..."
                : "You've seen everyone nearby. Check back later for new people!"}
            </Typography>
            <Button variant="primary" onPress={handleRefresh}>
              <View className="flex-row items-center gap-2">
                <RefreshCw size={18} color="#FFFFFF" />
                <Typography className="text-white">Refresh</Typography>
              </View>
            </Button>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {hasProfiles && (
        <View className="flex-row justify-center items-center gap-6 pb-4">
          {/* Undo */}
          <Pressable
            onPress={handleUndo}
            className="w-12 h-12 rounded-full bg-surface-elevated items-center justify-center border border-white/5 active:scale-95"
          >
            <RotateCcw size={20} color="#FFD166" />
          </Pressable>

          {/* Pass */}
          <Pressable
            onPress={() => handleButtonSwipe("left")}
            className="w-16 h-16 rounded-full bg-surface-elevated items-center justify-center border-2 border-danger/30 active:scale-95 active:bg-danger/20"
          >
            <X size={28} color="#EF4444" />
          </Pressable>

          {/* Super Like */}
          <Pressable
            onPress={() => handleButtonSwipe("up")}
            className="w-12 h-12 rounded-full bg-surface-elevated items-center justify-center border border-primary/30 active:scale-95 active:bg-primary/20"
          >
            <Sparkles size={20} color="#7C3AED" />
          </Pressable>

          {/* Like */}
          <Pressable
            onPress={() => handleButtonSwipe("right")}
            className="w-16 h-16 rounded-full bg-surface-elevated items-center justify-center border-2 border-success/30 active:scale-95 active:bg-success/20"
          >
            <Heart size={28} color="#16A34A" />
          </Pressable>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-elevated">
            <Pressable onPress={() => setShowFilters(false)}>
              <X size={24} color="#E6E6F0" />
            </Pressable>
            <Typography variant="h2">Filters</Typography>
            <Pressable onPress={resetFilters}>
              <Typography variant="label" color="primary">
                Reset
              </Typography>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-6">
            {/* Age Range */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Calendar size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Age Range
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {AGE_RANGES.map((range, index) => (
                  <Chip
                    key={range.label}
                    label={range.label}
                    variant={selectedAgeRange === index ? "primary" : "outline"}
                    selected={selectedAgeRange === index}
                    onPress={() =>
                      setSelectedAgeRange(
                        selectedAgeRange === index ? null : index,
                      )
                    }
                  />
                ))}
              </View>
            </View>

            {/* Distance */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <MapPin size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Maximum Distance
                </Typography>
              </View>
              <View className="flex-row flex-wrap gap-3">
                {DISTANCE_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    variant={
                      selectedDistance === option.value ? "primary" : "outline"
                    }
                    selected={selectedDistance === option.value}
                    onPress={() => setSelectedDistance(option.value)}
                  />
                ))}
              </View>
            </View>

            {/* Verified Only */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Users size={20} color="#7C3AED" />
                <Typography variant="h3" className="ml-2">
                  Profile Type
                </Typography>
              </View>
              <Card variant="elevated" padding="md">
                <Pressable
                  onPress={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Typography variant="body">
                      Verified Profiles Only
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Only show profiles that have been verified
                    </Typography>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-md items-center justify-center ${showVerifiedOnly
                      ? "bg-primary"
                      : "bg-surface border border-muted/30"
                      }`}
                  >
                    {showVerifiedOnly && <Check size={16} color="#FFFFFF" />}
                  </View>
                </Pressable>
              </Card>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-4 py-4 border-t border-surface-elevated">
            <Button
              variant="primary"
              size="lg"
              onPress={applyFilters}
              className="w-full"
            >
              Apply Filters
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
