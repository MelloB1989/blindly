import React from "react";
import { View, Image, StyleSheet, ViewStyle, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface AvatarProps {
  source?: string | any; // URI or require()
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
  style?: ViewStyle;
  glow?: boolean;
  locked?: boolean;
  bordered?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  className,
  size = "md",
  fallback = "?",
  style,
  glow = false,
  locked = false,
  bordered = true,
}) => {
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return 32;
      case "lg":
        return 80;
      case "xl":
        return 120;
      default:
        return 56; // md
    }
  };

  const dimension = getDimensions();
  const radius = dimension / 2;

  const InnerContent = () => (
    <View
      style={[
        styles.innerContainer,
        { borderRadius: radius - 2, backgroundColor: "#1A0244" },
      ]}
      className={className}
    >
      {source ? (
        <>
          <Image
            source={typeof source === "string" ? { uri: source } : source}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: radius - 2,
            }}
            resizeMode="cover"
          />
          {locked && (
            <BlurView intensity={30} tint="dark" style={styles.blurOverlay} />
          )}
        </>
      ) : (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackText, { fontSize: dimension / 2.5 }]}>
            {fallback.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, borderRadius: radius },
        glow && styles.glowEffect,
        style,
      ]}
    >
      {bordered ? (
        <LinearGradient
          colors={["#6A1BFF", "#FF4C61"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.borderGradient, { borderRadius: radius }]}
        >
          <InnerContent />
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, borderRadius: radius, overflow: "hidden" }}>
          <InnerContent />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  borderGradient: {
    padding: 2,
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A1A4D",
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  glowEffect: {
    shadowColor: "#6A1BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
