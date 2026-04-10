import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Typography } from "../ui/Typography";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  Pencil,
  Heart,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Trophy,
  Zap,
} from "lucide-react-native";

interface CompletionMeterProps {
  percent: number;
  missingItems?: string[];
  onPress?: () => void;
}

const MILESTONES = [
  { at: 25, label: "Starter", icon: Zap, color: "#FFD166" },
  { at: 50, label: "Getting there", icon: Heart, color: "#A78BFA" },
  { at: 75, label: "Almost!", icon: Sparkles, color: "#38BDF8" },
  { at: 100, label: "Complete!", icon: Trophy, color: "#14D679" },
];

export const CompletionMeter: React.FC<CompletionMeterProps> = ({
  percent,
  missingItems,
  onPress,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));

  const getGradient = (): [string, string] => {
    if (clampedPercent >= 80) return ["#14D679", "#10B981"];
    if (clampedPercent >= 50) return ["#7C3AED", "#A78BFA"];
    return ["#FFD166", "#F59E0B"];
  };

  const getMessage = () => {
    if (clampedPercent >= 100) return "Your profile is complete!";
    if (clampedPercent >= 80) return "Almost there! Just a few more touches.";
    if (clampedPercent >= 50) return "Looking good! Keep going.";
    return "Complete your profile to get more matches";
  };

  const getBoostMessage = () => {
    if (clampedPercent >= 100) return "Maximum visibility in the algorithm";
    if (clampedPercent >= 75) return "90% algorithm boost active";
    if (clampedPercent >= 50) return "60% algorithm boost active";
    return "Complete your profile for algorithm boost";
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Typography
              variant="body"
              className="text-white font-semibold text-[15px]"
            >
              {getMessage()}
            </Typography>
            <View className="flex-row items-center mt-1">
              <Zap size={11} color="#FFD166" />
              <Typography variant="caption" className="text-[#FFD166] ml-1 text-[11px]">
                {getBoostMessage()}
              </Typography>
            </View>
          </View>
          <View style={styles.percentBadge}>
            <Typography
              variant="label"
              className="text-white font-bold text-sm"
            >
              {clampedPercent}%
            </Typography>
          </View>
        </View>

        {/* Progress Bar with Milestones */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={getGradient()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${clampedPercent}%` },
              ]}
            />
          </View>

          {/* Milestone Dots */}
          <View style={styles.milestoneRow}>
            {MILESTONES.map((milestone) => {
              const reached = clampedPercent >= milestone.at;
              const Icon = milestone.icon;
              return (
                <View
                  key={milestone.at}
                  style={[
                    styles.milestoneDot,
                    { left: `${milestone.at - 2}%` },
                  ]}
                >
                  <View
                    style={[
                      styles.dotInner,
                      reached
                        ? { backgroundColor: milestone.color }
                        : { backgroundColor: "rgba(255,255,255,0.1)" },
                    ]}
                  >
                    {reached && <CheckCircle2 size={8} color="#FFF" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action hint */}
        {clampedPercent < 100 && (
          <View className="flex-row items-center justify-between mt-3">
            <Typography variant="caption" className="text-white/40 text-[11px]">
              Tap to complete your profile
            </Typography>
            <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  content: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  percentBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124,58,237,0.2)",
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    position: "relative",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  milestoneRow: {
    position: "relative",
    height: 16,
    marginTop: 4,
  },
  milestoneDot: {
    position: "absolute",
    top: 0,
  },
  dotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
});
