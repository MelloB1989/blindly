import React, { useState } from "react";
import {
  View,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Badge } from "../../components/ui/Badge";
import { GlassCard } from "../../components/ui/GlassCard";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { useStore } from "../../store/useStore";
import { authService } from "../../services/auth";
import {
  Settings,
  Shield,
  Sparkles,
  Camera,
  CheckCircle2,
  Edit3,
  ChevronRight,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  X,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isOnboardingComplete } = useStore();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Default user data for display
  const displayUser = user || {
    firstName: "User",
    lastName: "",
    age: 0,
    bio: "No bio yet",
    hobbies: [],
    personalityTraits: {},
    photos: [],
    isVerified: false,
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.signOut();
            logout();
            router.replace("/(auth)/welcome" as Href);
          } catch (error) {
            console.error("Logout error:", error);
            // Still logout locally even if server logout fails
            logout();
            router.replace("/(auth)/welcome" as Href);
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing coming soon!");
  };

  const handleEditPhoto = () => {
    Alert.alert("Change Photo", "Photo upload coming soon!");
  };

  const handleAIBioRewrite = () => {
    Alert.alert(
      "AI Bio Rewrite",
      "Let AI help you write a more engaging bio?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => {
            Alert.alert("Coming Soon", "AI bio generation is in development!");
          },
        },
      ],
    );
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let score = 0;
    if (displayUser.firstName) score += 20;
    if (displayUser.bio && displayUser.bio !== "No bio yet") score += 25;
    if (displayUser.hobbies && displayUser.hobbies.length > 0) score += 25;
    if (
      displayUser.personalityTraits &&
      Object.keys(displayUser.personalityTraits).length > 0
    )
      score += 20;
    if (displayUser.photos && displayUser.photos.length > 0) score += 10;
    return score;
  };

  const completionPercentage = calculateCompletion();

  // Get personality trait labels from scores
  const getTraitLabels = () => {
    if (!displayUser.personalityTraits) return [];
    return Object.keys(displayUser.personalityTraits).slice(0, 4);
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 py-4 flex-row justify-between items-center">
            <Typography variant="h1" className="text-white">
              Profile
            </Typography>
            <Pressable
              onPress={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
            >
              <Settings size={22} color="#E6E6F0" />
            </Pressable>
          </View>

          {/* Profile Header Card */}
          <View className="items-center px-6 mb-6">
            <Pressable onPress={handleEditPhoto} className="relative mb-4">
              <Avatar
                source={displayUser.photos?.[0]}
                fallback={displayUser.firstName}
                size="xl"
                // className="border-4 border-[#6A1BFF]/30"
                glow
              />
              <View className="absolute bottom-0 right-0 bg-[#6A1BFF] rounded-full p-2 border-2 border-[#1A0244]">
                <Camera size={16} color="#FFFFFF" />
              </View>
            </Pressable>

            <View className="flex-row items-center gap-2 mb-1">
              <Typography variant="h2" className="text-white">
                {displayUser.firstName}
                {displayUser.age ? `, ${displayUser.age}` : ""}
              </Typography>
              {displayUser.isVerified && (
                <CheckCircle2 size={20} color="#14D679" fill="#14D679" />
              )}
            </View>

            {user?.email && (
              <Typography variant="caption" className="text-white/60">
                {user.email}
              </Typography>
            )}

            <Button
              variant="secondary"
              size="sm"
              onPress={handleEditProfile}
              className="mt-4 bg-white/10 border border-white/10"
              icon={<Edit3 size={14} color="#E6E6F0" />}
            >
              <Typography className="text-white">Edit Profile</Typography>
            </Button>
          </View>

          {/* Stats / Quick Actions */}
          <View className="flex-row px-6 gap-3 mb-6">
            <GlassCard className="flex-1 items-center py-4" intensity={30}>
              <View className="flex-row items-center gap-1 mb-1">
                <Typography variant="h2" className="text-[#6A1BFF] font-bold">
                  {completionPercentage}%
                </Typography>
              </View>
              <Typography variant="caption" className="text-white/60">
                Profile Complete
              </Typography>
              <View className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <View
                  className="h-full bg-[#6A1BFF] rounded-full shadow-[0_0_8px_#6A1BFF]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </View>
            </GlassCard>
            <GlassCard className="flex-1 items-center py-4" intensity={30}>
              <View className="flex-row items-center gap-1 mb-1">
                <Heart size={16} color="#FFD166" fill="#FFD166" />
                <Typography variant="h2" className="text-[#FFD166] font-bold">
                  12
                </Typography>
              </View>
              <Typography variant="caption" className="text-white/60">
                Matches
              </Typography>
            </GlassCard>
          </View>

          {/* Bio Section */}
          <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Typography variant="h3" className="text-white">
                Bio
              </Typography>
              <Pressable
                onPress={handleAIBioRewrite}
                className="flex-row items-center bg-[#FFD166]/10 px-3 py-1.5 rounded-full border border-[#FFD166]/20"
              >
                <Sparkles size={14} color="#FFD166" />
                <Typography variant="caption" className="ml-1.5 text-[#FFD166]">
                  AI Rewrite
                </Typography>
              </Pressable>
            </View>
            <GlassCard className="p-4" intensity={20}>
              <Typography
                variant="body"
                className="leading-relaxed text-white/90"
              >
                {displayUser.bio || "Add a bio to tell people about yourself!"}
              </Typography>
            </GlassCard>
          </View>

          {/* Hobbies & Traits */}
          <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Typography variant="h3" className="text-white">
                Interests
              </Typography>
              <Pressable>
                <Typography variant="caption" className="text-[#6A1BFF]">
                  Edit
                </Typography>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {displayUser.hobbies && displayUser.hobbies.length > 0 ? (
                displayUser.hobbies.map((hobby) => (
                  <Chip key={hobby} label={hobby} variant="primary" />
                ))
              ) : (
                <Typography variant="body" className="text-white/50">
                  No interests added yet
                </Typography>
              )}
              {displayUser.hobbies && displayUser.hobbies.length > 0 && (
                <Chip
                  label="+ Add"
                  variant="outline"
                  onPress={handleEditProfile}
                />
              )}
            </View>

            <Typography variant="h3" className="mb-3 text-white">
              Personality
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {getTraitLabels().length > 0 ? (
                getTraitLabels().map((trait) => (
                  <Badge
                    key={trait}
                    label={trait}
                    variant="default"
                    size="md"
                  />
                ))
              ) : (
                <Typography variant="body" className="text-white/50">
                  Complete the personality quiz to show your traits
                </Typography>
              )}
            </View>
          </View>

          {/* Quick Settings */}
          <View className="px-6 mb-6">
            <Typography variant="h3" className="mb-3 text-white">
              Quick Settings
            </Typography>

            <GlassCard className="mb-3" intensity={20}>
              <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-10 h-10 rounded-full bg-[#FFD166]/20 items-center justify-center border border-[#FFD166]/20">
                    <Sparkles size={18} color="#FFD166" />
                  </View>
                  <View className="flex-1">
                    <Typography variant="body" className="text-white">
                      AI Features
                    </Typography>
                    <Typography variant="caption" className="text-white/50">
                      Smart suggestions & matching
                    </Typography>
                  </View>
                </View>
                <Switch
                  value={aiEnabled}
                  onValueChange={setAiEnabled}
                  trackColor={{ false: "#16161B", true: "#6A1BFF" }}
                  thumbColor={"#E6E6F0"}
                />
              </View>
            </GlassCard>

            <Pressable>
              <GlassCard className="mb-3" intensity={20}>
                <View className="flex-row justify-between items-center p-4">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 rounded-full bg-[#6A1BFF]/20 items-center justify-center border border-[#6A1BFF]/20">
                      <Eye size={18} color="#6A1BFF" />
                    </View>
                    <View className="flex-1">
                      <Typography variant="body" className="text-white">
                        Photo Visibility
                      </Typography>
                      <Typography variant="caption" className="text-white/50">
                        Hidden until you unlock
                      </Typography>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#666680" />
                </View>
              </GlassCard>
            </Pressable>

            <Pressable>
              <GlassCard intensity={20}>
                <View className="flex-row justify-between items-center p-4">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 rounded-full bg-[#14D679]/20 items-center justify-center border border-[#14D679]/20">
                      <Shield size={18} color="#14D679" />
                    </View>
                    <View className="flex-1">
                      <Typography variant="body" className="text-white">
                        Safety Center
                      </Typography>
                      <Typography variant="caption" className="text-white/50">
                        Block, report & privacy settings
                      </Typography>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#666680" />
                </View>
              </GlassCard>
            </Pressable>
          </View>

          {/* Logout Button */}
          <View className="px-6 mb-8">
            <Button
              variant="secondary"
              className="w-full border border-[#FF4C61]/30 bg-[#FF4C61]/10"
              onPress={handleLogout}
              loading={isLoggingOut}
              icon={<LogOut size={18} color="#FF4C61" />}
            >
              <Typography className="text-[#FF4C61]">Log Out</Typography>
            </Button>
          </View>

          {/* App Info */}
          <View className="items-center mb-8">
            <Typography variant="caption" className="text-white/40">
              Blindly v1.0.0
            </Typography>
            <Typography variant="caption" className="mt-1 text-white/40">
              Made with 💜 for meaningful connections
            </Typography>
          </View>
        </ScrollView>

        {/* Settings Modal - keeping simpler for now or can maintain original structure but wrap content */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <GradientBackground>
            <SafeAreaView className="flex-1">
              <View className="flex-row justify-between items-center px-4 py-4 border-b border-white/5 bg-white/5">
                <Typography variant="h2" className="text-white">
                  Settings
                </Typography>
                <Pressable
                  onPress={() => setShowSettingsModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
                >
                  <X size={22} color="#E6E6F0" />
                </Pressable>
              </View>
              {/* Simplified content placeholder for modal to avoid huge diff, mainly wanted main screen consistent */}
              <View className="flex-1 items-center justify-center">
                <Typography className="text-white">Settings Content</Typography>
              </View>
            </SafeAreaView>
          </GradientBackground>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
