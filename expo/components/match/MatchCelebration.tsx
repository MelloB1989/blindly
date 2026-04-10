import React, { useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Typography } from "../ui/Typography";
import { Avatar } from "../ui/Avatar";
import { Heart, MessageCircle, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MatchCelebrationProps {
  visible: boolean;
  myPhoto?: string;
  myName: string;
  theirPhoto?: string;
  theirName: string;
  onStartChatting: () => void;
  onKeepSwiping: () => void;
}

export const MatchCelebration: React.FC<MatchCelebrationProps> = ({
  visible,
  myPhoto,
  myName,
  theirPhoto,
  theirName,
  onStartChatting,
  onKeepSwiping,
}) => {
  const heartScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      heartScale.value = withRepeat(
        withSequence(
          withTiming(1.3, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={["rgba(8,3,20,0.97)", "rgba(30,10,74,0.97)", "rgba(8,3,20,0.97)"]}
          style={styles.gradient}
        >
          {/* Floating Particles (decorative) */}
          {[...Array(8)].map((_, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.duration(800).delay(i * 100)}
              style={[
                styles.particle,
                {
                  left: `${15 + (i * 10)}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  backgroundColor: [
                    "#7C3AED",
                    "#A78BFA",
                    "#F472B6",
                    "#FFD166",
                    "#38BDF8",
                    "#14D679",
                    "#7C3AED",
                    "#A78BFA",
                  ][i],
                },
              ]}
            />
          ))}

          <View style={styles.content}>
            {/* Title */}
            <Animated.View
              entering={ZoomIn.duration(600)}
              style={styles.titleSection}
            >
              <Sparkles size={20} color="#FFD166" />
              <Typography
                variant="h1"
                className="text-white text-3xl font-bold mx-3"
              >
                It's a Match!
              </Typography>
              <Sparkles size={20} color="#FFD166" />
            </Animated.View>

            {/* Avatars */}
            <Animated.View
              entering={FadeInUp.duration(800).delay(200)}
              style={styles.avatarsSection}
            >
              {/* My Avatar */}
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={["#7C3AED", "#A78BFA"]}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatarInner}>
                    <Avatar source={myPhoto} fallback={myName} size="xl" />
                  </View>
                </LinearGradient>
                <Typography
                  variant="caption"
                  className="text-white/60 mt-2"
                >
                  You
                </Typography>
              </View>

              {/* Heart */}
              <Animated.View style={[styles.heartContainer, heartStyle]}>
                <Animated.View style={[styles.heartGlow, glowStyle]} />
                <LinearGradient
                  colors={["#F472B6", "#FF4C61"]}
                  style={styles.heartGradient}
                >
                  <Heart size={24} color="#FFF" fill="#FFF" />
                </LinearGradient>
              </Animated.View>

              {/* Their Avatar */}
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={["#F472B6", "#7C3AED"]}
                  style={styles.avatarBorder}
                >
                  <View style={styles.avatarInner}>
                    <Avatar source={theirPhoto} fallback={theirName} size="xl" />
                  </View>
                </LinearGradient>
                <Typography
                  variant="caption"
                  className="text-white/60 mt-2"
                >
                  {theirName}
                </Typography>
              </View>
            </Animated.View>

            {/* Message */}
            <Animated.View
              entering={FadeIn.duration(600).delay(500)}
              style={styles.messageSection}
            >
              <Typography
                variant="body"
                className="text-white/60 text-center leading-6 mb-1"
              >
                You and {theirName} liked each other!
              </Typography>
              <View
                className="flex-row items-center justify-center px-4 py-2 rounded-full mt-1"
                style={{ backgroundColor: "rgba(253,230,138,0.08)" }}
              >
                <Sparkles size={12} color="#FFD166" />
                <Typography
                  variant="caption"
                  className="text-[#FFD166] ml-1.5 text-[11px]"
                >
                  Chat to unlock photos & see each other
                </Typography>
              </View>
            </Animated.View>

            {/* Actions */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(700)}
              style={styles.actionsSection}
            >
              <Pressable onPress={onStartChatting}>
                <LinearGradient
                  colors={["#7C3AED", "#A78BFA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <MessageCircle size={20} color="#FFF" />
                  <Typography className="text-white font-bold text-base ml-2">
                    Start Chatting
                  </Typography>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={onKeepSwiping}
                style={styles.secondaryButton}
              >
                <Typography className="text-white/50 font-medium">
                  Keep Swiping
                </Typography>
              </Pressable>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
    borderRadius: 100,
    opacity: 0.4,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  avatarsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    alignItems: "center",
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 100,
  },
  avatarInner: {
    backgroundColor: "#080314",
    padding: 3,
    borderRadius: 100,
  },
  heartContainer: {
    marginHorizontal: -16,
    zIndex: 10,
    position: "relative",
  },
  heartGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F472B6",
    top: -7,
    left: -7,
  },
  heartGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#080314",
  },
  messageSection: {
    marginBottom: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionsSection: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
