import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View, Image, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Extrapolation,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "./Typography";
import { Chip } from "./Chip";
import { Badge } from "./Badge";
import {
  Heart,
  X,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  Globe,
  Star,
  Flag,
  Share2,
  Lock,
  Quote,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Wine,
  Cigarette,
  Baby,
  Church,
  Users,
  Dumbbell,
  Eye,
  EyeOff,
  Fingerprint,
  Brain,
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VERTICAL_THRESHOLD = SCREEN_HEIGHT * 0.15;
const ROTATION_ANGLE = 12;

export interface SwipeCardProfile {
  id: string;
  firstName: string;
  age: number;
  bio: string;
  hobbies: string[];
  traits: string[];
  photos: string[];
  isRevealed: boolean;
  isVerified: boolean;
  matchScore: number;
  distance: string;
  area?: string;
  languages?: string[];
  zodiac?: string;
  lastActive?: string;
  prompts?: { question: string; answer: string }[];
  aiSummary?: string;
  extra?: {
    school?: string;
    work?: string;
    lookingFor?: string[];
    exercise?: string;
    drinking?: string;
    smoking?: string;
    kids?: string;
    religion?: string;
    ethnicity?: string;
    sexuality?: string;
  };
}

interface SwipeCardProps {
  profile: SwipeCardProfile;
  onSwipeLeft?: (profile: SwipeCardProfile) => void;
  onSwipeRight?: (profile: SwipeCardProfile) => void;
  onSwipeUp?: (profile: SwipeCardProfile) => void;
  onShare?: (profile: SwipeCardProfile) => void;
  onReport?: (profile: SwipeCardProfile) => void;
  onAskAi?: (profile: SwipeCardProfile) => void;
  isFirst?: boolean;
  index?: number;
}

export function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onShare,
  onReport,
  onAskAi,
  isFirst = false,
  index = 0,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Track which action will be taken
  const activeAction = useSharedValue<"none" | "like" | "nope" | "super">(
    "none",
  );

  const handleSwipeComplete = (direction: "left" | "right" | "up") => {
    if (direction === "left" && onSwipeLeft) {
      onSwipeLeft(profile);
    } else if (direction === "right" && onSwipeRight) {
      onSwipeRight(profile);
    } else if (direction === "up" && onSwipeUp) {
      onSwipeUp(profile);
    }
  };

  const determineAction = (
    x: number,
    y: number,
  ): "none" | "like" | "nope" | "super" => {
    "worklet";
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    // If vertical movement is dominant and significant, it's a super like
    if (y < -VERTICAL_THRESHOLD && absY > absX * 1.5) {
      return "super";
    }

    // If horizontal movement is dominant
    if (absX > SWIPE_THRESHOLD * 0.5) {
      if (x > 0) {
        return "like";
      } else {
        return "nope";
      }
    }

    return "none";
  };

  const panGesture = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Determine which action indicator to show
      activeAction.value = determineAction(
        event.translationX,
        event.translationY,
      );
    })
    .onEnd((event) => {
      const action = determineAction(event.translationX, event.translationY);

      // Super like (swipe up) - only if it's clearly a vertical gesture
      if (action === "super") {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)("up");
        });
        translateX.value = withTiming(translateX.value * 0.5, {
          duration: 300,
        });
        activeAction.value = "none";
        return;
      }

      // Swipe right (like)
      if (
        action === "like" &&
        (translateX.value > SWIPE_THRESHOLD || event.velocityX > 800)
      ) {
        translateX.value = withTiming(
          SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipeComplete)("right");
          },
        );
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
        activeAction.value = "none";
        return;
      }

      // Swipe left (pass)
      if (
        action === "nope" &&
        (translateX.value < -SWIPE_THRESHOLD || event.velocityX < -800)
      ) {
        translateX.value = withTiming(
          -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipeComplete)("left");
          },
        );
        translateY.value = withTiming(translateY.value + 50, { duration: 300 });
        activeAction.value = "none";
        return;
      }

      // Return to center
      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      activeAction.value = "none";
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    // Scale down cards that are behind
    const cardScale = isFirst
      ? scale.value
      : interpolate(index, [0, 1, 2], [1, 0.95, 0.9], Extrapolation.CLAMP);

    // Offset cards behind vertically
    const cardTranslateY = isFirst
      ? translateY.value
      : interpolate(index, [0, 1, 2], [0, -15, -30], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: cardTranslateY },
        { rotate: `${rotation}deg` },
        { scale: cardScale },
      ],
    };
  });

  // Only show LIKE indicator when action is "like"
  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "like" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  // Only show NOPE indicator when action is "nope"
  const nopeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "nope" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  // Only show SUPER indicator when action is "super"
  const superLikeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = activeAction.value === "super" ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  const handleShare = () => {
    if (onShare) {
      onShare(profile);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(profile);
    }
  };

  const handleAskAi = () => {
    if (onAskAi) {
      onAskAi(profile);
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.cardContainer,
          cardAnimatedStyle,
          { zIndex: 100 - index },
        ]}
      >
        {/* Swipe Indicators - Only show one at a time */}
        {isFirst && (
          <>
            {/* LIKE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.likeIndicator,
                likeIndicatorStyle,
              ]}
            >
              <Heart size={32} color="#14D679" fill="#14D679" />
              <Typography variant="h3" className="text-success ml-2">
                LIKE
              </Typography>
            </Animated.View>

            {/* NOPE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.nopeIndicator,
                nopeIndicatorStyle,
              ]}
            >
              <X size={32} color="#FF4C61" strokeWidth={3} />
              <Typography variant="h3" className="text-danger ml-2">
                NOPE
              </Typography>
            </Animated.View>

            {/* SUPER LIKE Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                styles.superLikeIndicator,
                superLikeIndicatorStyle,
              ]}
            >
              <Sparkles size={32} color="#6A1BFF" fill="#6A1BFF" />
              <Typography variant="h3" className="text-primary ml-2">
                SUPER
              </Typography>
            </Animated.View>
          </>
        )}

        {/* Card Content */}
        <Animated.ScrollView
          className="flex-1 rounded-[32px] overflow-hidden"
          style={{ backgroundColor: "#110827" }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isFirst}
          nestedScrollEnabled
        >
          {/* Personality-First Hero Section */}
          <LinearGradient
            colors={["#1E0A4A", "#170835", "#110827"]}
            style={styles.heroSection}
          >
            {/* Top Actions */}
            <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
              <Badge
                label={`${profile.matchScore}% Match`}
                variant="ai"
                icon={<Sparkles size={10} color="#FFD166" />}
              />
              <View className="flex-row gap-2">
                <Pressable
                  className="w-8 h-8 rounded-full bg-white/8 items-center justify-center"
                  onPress={handleShare}
                >
                  <Share2 size={16} color="#A6A3B8" />
                </Pressable>
                <Pressable
                  className="w-8 h-8 rounded-full bg-white/8 items-center justify-center"
                  onPress={handleReport}
                >
                  <Flag size={16} color="#A6A3B8" />
                </Pressable>
              </View>
            </View>

            {/* Mystery Avatar + Name */}
            <View className="items-center pt-2 pb-4">
              <View style={styles.mysteryAvatarOuter}>
                <LinearGradient
                  colors={["#7C3AED", "#A78BFA", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mysteryAvatarGradient}
                >
                  <View style={styles.mysteryAvatarInner}>
                    {profile.photos && profile.photos.length > 0 ? (
                      <>
                        <Image
                          source={{ uri: profile.photos[0] }}
                          style={styles.mysteryPhoto}
                          blurRadius={profile.isRevealed ? 0 : 30}
                        />
                        {!profile.isRevealed && (
                          <View style={styles.mysteryOverlay}>
                            <Fingerprint size={32} color="#A78BFA" />
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.mysteryOverlay}>
                        <Fingerprint size={32} color="#A78BFA" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                {!profile.isRevealed && (
                  <View style={styles.lockBadge}>
                    <EyeOff size={10} color="#FFF" />
                  </View>
                )}
              </View>

              {/* Name & Age */}
              <View className="flex-row items-center gap-2 mt-3">
                <Typography variant="h2" className="text-xl text-white font-bold">
                  {profile.firstName}, {profile.age}
                </Typography>
                {profile.isVerified && (
                  <CheckCircle2 size={18} color="#16A34A" fill="#16A34A" />
                )}
              </View>

              {/* Location & Meta */}
              <View className="flex-row items-center gap-3 mt-1.5">
                <View className="flex-row items-center">
                  <MapPin size={12} color="#A6A3B8" />
                  <Typography variant="caption" color="muted" className="ml-1">
                    {profile.distance}
                  </Typography>
                </View>
                {profile.zodiac && (
                  <View className="flex-row items-center">
                    <Star size={12} color="#FFD166" />
                    <Typography variant="caption" color="muted" className="ml-1">
                      {profile.zodiac}
                    </Typography>
                  </View>
                )}
                {profile.lastActive && (
                  <View className="flex-row items-center">
                    <Clock size={12} color="#A6A3B8" />
                    <Typography variant="caption" color="muted" className="ml-1">
                      {profile.lastActive}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Photos Hidden Label */}
              {!profile.isRevealed && (
                <View className="flex-row items-center mt-3 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(124,58,237,0.15)" }}>
                  <EyeOff size={12} color="#A78BFA" />
                  <Typography variant="caption" className="ml-1.5 text-[#A78BFA] text-[11px]">
                    Photos reveal after matching & chatting
                  </Typography>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Profile Content */}
          <View className="px-4 pb-6">
            {/* Personality Traits - Visual Bars */}
            {profile.traits && profile.traits.length > 0 && (
              <View className="mb-5 mt-1">
                <View className="flex-row items-center mb-3">
                  <Brain size={14} color="#A78BFA" />
                  <Typography variant="label" className="ml-2 text-[#A78BFA] uppercase tracking-wider text-[10px]">
                    Personality
                  </Typography>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {profile.traits.slice(0, 5).map((trait) => (
                    <View
                      key={trait}
                      className="px-3 py-1.5 rounded-full border"
                      style={{ backgroundColor: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.25)" }}
                    >
                      <Typography variant="caption" className="text-[#C4B5FD] text-xs font-medium">
                        {trait}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI Summary */}
            <View className="mb-5 rounded-2xl p-4 border" style={{ backgroundColor: "rgba(253,230,138,0.05)", borderColor: "rgba(253,230,138,0.15)" }}>
              <View className="flex-row items-center mb-2">
                <Sparkles size={14} color="#FFD166" />
                <Typography variant="label" color="ai" className="ml-2 text-xs">
                  AI Summary
                </Typography>
              </View>
              <Typography
                variant="body"
                className="text-sm leading-relaxed text-white/70"
              >
                {profile.aiSummary ||
                  `${profile.firstName} appears to be a ${profile.traits[0]?.toLowerCase() || "unique"
                  } soul who loves ${profile.hobbies[0]?.toLowerCase() || "exploring"
                  }. A perfect match if you're looking for someone ${profile.traits[1]?.toLowerCase() || "genuine"
                  }!`}
              </Typography>
            </View>

            {/* Ask Maytri */}
            <Pressable
              onPress={handleAskAi}
              className="flex-row items-center justify-center py-2.5 rounded-xl mb-5 active:opacity-80"
              style={{ backgroundColor: "rgba(253,230,138,0.08)", borderWidth: 1, borderColor: "rgba(253,230,138,0.2)" }}
            >
              <MessageCircle size={16} color="#FFD166" />
              <Typography variant="caption" color="ai" className="ml-2 font-semibold">
                Ask Maytri about {profile.firstName}
              </Typography>
            </Pressable>

            {/* Bio */}
            {profile.bio ? (
              <View className="mb-5">
                <Typography variant="label" className="mb-2 text-white/90 text-sm font-semibold">
                  About
                </Typography>
                <Typography
                  variant="body"
                  className="leading-relaxed text-white/70 text-sm"
                  numberOfLines={4}
                >
                  {profile.bio}
                </Typography>
              </View>
            ) : null}

            {/* Prompts */}
            {profile.prompts && profile.prompts.length > 0 && (
              <View className="mb-5">
                {profile.prompts.slice(0, 2).map((prompt, idx) => (
                  <View
                    key={idx}
                    className="mb-3 rounded-2xl p-4 border"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <View className="flex-row items-start">
                      <Quote
                        size={14}
                        color="#7C3AED"
                        style={{ marginTop: 2, marginRight: 8 }}
                      />
                      <View className="flex-1">
                        <Typography
                          variant="caption"
                          className="mb-1 font-medium uppercase tracking-wide text-[10px] text-[#A78BFA]"
                        >
                          {prompt.question}
                        </Typography>
                        <Typography
                          variant="body"
                          className="text-sm italic text-white/80 leading-5"
                        >
                          &quot;{prompt.answer}&quot;
                        </Typography>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Hobbies & Interests */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <View className="mb-5">
                <Typography variant="label" className="mb-2 text-white/50 uppercase tracking-wider text-[10px]">
                  Interests & Hobbies
                </Typography>
                <View className="flex-row flex-wrap gap-2">
                  {profile.hobbies.slice(0, 6).map((hobby) => (
                    <View
                      key={hobby}
                      className="px-3 py-1.5 rounded-full border"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      <Typography variant="caption" className="text-white/70 text-xs">
                        {hobby}
                      </Typography>
                    </View>
                  ))}
                  {profile.hobbies.length > 6 && (
                    <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(124,58,237,0.15)" }}>
                      <Typography variant="caption" className="text-[#A78BFA] text-xs">
                        +{profile.hobbies.length - 6}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Quick Info Row */}
            {profile.extra && Object.values(profile.extra).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
              <View className="mb-5">
                <Typography variant="label" className="mb-2 text-white/50 uppercase tracking-wider text-[10px]">
                  Lifestyle
                </Typography>
                <View className="flex-row flex-wrap gap-2">
                  {profile.extra.work && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Briefcase size={12} color="#A78BFA" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.work}</Typography>
                    </View>
                  )}
                  {profile.extra.school && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <GraduationCap size={12} color="#60A5FA" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.school}</Typography>
                    </View>
                  )}
                  {profile.extra.exercise && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Dumbbell size={12} color="#34D399" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.exercise}</Typography>
                    </View>
                  )}
                  {profile.extra.drinking && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Wine size={12} color="#F472B6" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.drinking}</Typography>
                    </View>
                  )}
                  {profile.extra.smoking && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Cigarette size={12} color="#FB923C" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.smoking}</Typography>
                    </View>
                  )}
                  {profile.extra.kids && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Baby size={12} color="#FCD34D" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.kids}</Typography>
                    </View>
                  )}
                  {profile.extra.religion && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Church size={12} color="#94A3B8" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">{profile.extra.religion}</Typography>
                    </View>
                  )}
                  {profile.languages && profile.languages.length > 0 && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Globe size={12} color="#7C3AED" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">
                        {profile.languages.slice(0, 2).join(", ")}
                      </Typography>
                    </View>
                  )}
                  {profile.extra.lookingFor && profile.extra.lookingFor.length > 0 && (
                    <View className="flex-row items-center rounded-full px-3 py-1.5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <Heart size={12} color="#F472B6" />
                      <Typography variant="caption" className="ml-1.5 text-white/70 text-xs">
                        {profile.extra.lookingFor.join(", ")}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Bottom Spacing */}
            <View className="h-6" />
          </View>
        </Animated.ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.72,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroSection: {
    paddingBottom: 8,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  mysteryAvatarOuter: {
    position: "relative",
  },
  mysteryAvatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
  },
  mysteryAvatarInner: {
    flex: 1,
    borderRadius: 41,
    overflow: "hidden",
    backgroundColor: "#110827",
    justifyContent: "center",
    alignItems: "center",
  },
  mysteryPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mysteryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,8,39,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#110827",
  },
  indicator: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 2,
  },
  likeIndicator: {
    top: 60,
    left: 20,
    borderColor: "#14D679",
    backgroundColor: "rgba(20, 214, 121, 0.2)",
    transform: [{ rotate: "-12deg" }],
    shadowColor: "#14D679",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  nopeIndicator: {
    top: 60,
    right: 20,
    borderColor: "#FF4C61",
    backgroundColor: "rgba(255, 76, 97, 0.2)",
    transform: [{ rotate: "12deg" }],
    shadowColor: "#FF4C61",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  superLikeIndicator: {
    bottom: 100,
    alignSelf: "center",
    borderColor: "#6A1BFF",
    backgroundColor: "rgba(106, 27, 255, 0.2)",
    shadowColor: "#6A1BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});

export default SwipeCard;
