import React, { useCallback, useState } from "react";
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
} from "react-native";
import { useRouter, Href } from "expo-router";
import Animated, { FadeOut, BounceIn } from "react-native-reanimated";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SwipeCard, SwipeCardProfile } from "../../components/ui/SwipeCard";
import { useStore } from "../../store/useStore";
import { MOCK_USERS } from "../../constants/mockData";
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
  { label: "1 mile", value: 1 },
  { label: "5 miles", value: 5 },
  { label: "10 miles", value: 10 },
  { label: "25 miles", value: 25 },
  { label: "50+ miles", value: 50 },
];

export default function SwipeScreen() {
  const router = useRouter();
  const { profiles, currentIndex, swipeProfile, setProfiles } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [lastAction, setLastAction] = useState<{
    profile: SwipeCardProfile;
    action: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "like" | "pass" | "superlike";
    text: string;
  } | null>(null);

  // Filter states
  const [selectedAgeRange, setSelectedAgeRange] = useState<number | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(25);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Initialize profiles from mock data if empty
  React.useEffect(() => {
    if (profiles.length === 0) {
      const formattedProfiles: SwipeCardProfile[] = MOCK_USERS.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        age: user.age,
        bio: user.bio,
        hobbies: user.hobbies,
        traits: user.traits,
        photos: user.photos,
        isRevealed: user.isRevealed,
        isVerified: user.isVerified || user.matchScore > 80,
        matchScore: user.matchScore,
        distance: user.distance,
        area: user.area,
        languages: user.languages,
        zodiac: user.zodiac,
        lastActive: user.lastActive,
        prompts: user.prompts,
      }));
      setProfiles(formattedProfiles);
    }
  }, [profiles.length, setProfiles]);

  const handleSwipeLeft = useCallback(
    (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Passed" });
      setFeedback({ type: "pass", text: "NOPE" });
      setTimeout(() => setFeedback(null), 800);
      swipeProfile("pass");
    },
    [swipeProfile],
  );

  const handleSwipeRight = useCallback(
    (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Liked" });
      setFeedback({ type: "like", text: "LIKE" });
      setTimeout(() => setFeedback(null), 800);
      const result = swipeProfile("like");
      // In real app, this would call API and potentially show match modal
      if (result) {
        // Check for match (mock: random 30% chance)
        if (Math.random() < 0.3) {
          Alert.alert(
            "It's a Match! 🎉",
            `You and ${profile.firstName} liked each other! Start chatting to unlock photos.`,
            [
              { text: "Start Chatting", onPress: () => {} },
              { text: "Keep Swiping" },
            ],
          );
        }
      }
    },
    [swipeProfile],
  );

  const handleSwipeUp = useCallback(
    (profile: SwipeCardProfile) => {
      setLastAction({ profile, action: "Super Liked" });
      setFeedback({ type: "superlike", text: "SUPER LIKE" });
      setTimeout(() => setFeedback(null), 800);
      swipeProfile("superlike");
      Alert.alert(
        "Super Like Sent! ⭐",
        `${profile.firstName} will be notified that you super liked them!`,
      );
    },
    [swipeProfile],
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
      // In a real app, we would pass this context to the AI chat
      // For now, we'll just navigate
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
              // TODO: Implement actual undo logic
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

  const applyFilters = () => {
    // TODO: Apply filters to profiles
    console.log("Applying filters:", {
      ageRange: selectedAgeRange !== null ? AGE_RANGES[selectedAgeRange] : null,
      distance: selectedDistance,
      verifiedOnly: showVerifiedOnly,
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedAgeRange(null);
    setSelectedDistance(25);
    setShowVerifiedOnly(false);
  };

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const hasProfiles = visibleProfiles.length > 0;

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
              className={`px-10 py-6 border-8 rounded-3xl transform -rotate-12 ${
                feedback.type === "like"
                  ? "border-success bg-success/20"
                  : feedback.type === "pass"
                    ? "border-danger bg-danger/20"
                    : "border-primary bg-primary/20"
              }`}
            >
              <Typography
                variant="h1"
                className={`text-6xl font-black uppercase tracking-widest ${
                  feedback.type === "like"
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
          visibleProfiles
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
            .reverse()
        ) : (
          <View className="items-center justify-center px-8">
            <View className="w-24 h-24 rounded-full bg-surface-elevated items-center justify-center mb-6">
              <Heart size={48} color="#7C3AED" />
            </View>
            <Typography variant="h2" className="text-center mb-2">
              No more profiles
            </Typography>
            <Typography
              variant="body"
              color="muted"
              className="text-center mb-6"
            >
              You&apos;ve seen everyone nearby. Check back later for new people!
            </Typography>
            <Button
              variant="primary"
              onPress={() => {
                setProfiles([]);
                // Refetch profiles
              }}
            >
              Refresh
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
                    className={`w-6 h-6 rounded-md items-center justify-center ${
                      showVerifiedOnly
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
