import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "../../store/useStore";
import { graphqlAuthService, GraphQLUser } from "../../services/graphql-auth";
import { authService } from "../../services/auth";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Settings, LogOut, X } from "lucide-react-native";

// New Components
import { ProfileHeader, VerificationStatus } from "../../components/profile/ProfileHeader";
import { CompletionMeter } from "../../components/profile/CompletionMeter";
import { BioSection } from "../../components/profile/BioSection";
import { PhotoGrid } from "../../components/profile/PhotoGrid";
import { MetadataDisplay } from "../../components/profile/MetadataDisplay";
import { PromptsDisplay } from "../../components/profile/PromptsDisplay";
import { VerificationFlow } from "../../components/profile/VerificationFlow";

import Constants from "expo-constants";

const version = Constants.expoConfig?.version ?? "(latest)";

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const convertToUserProfile = (gqlUser: GraphQLUser) => {
  const personalityTraits: Record<string, number> = {};
  gqlUser.personality_traits?.forEach((trait) => {
    personalityTraits[trait.key] = trait.value;
  });

  return {
    id: gqlUser.id,
    email: gqlUser.email,
    firstName: gqlUser.first_name,
    lastName: gqlUser.last_name,
    age: gqlUser.dob ? calculateAge(gqlUser.dob) : undefined,
    bio: gqlUser.bio || "",
    hobbies: gqlUser.hobbies || [],
    personalityTraits,
    photos: gqlUser.photos || [],
    isVerified: gqlUser.is_verified,
    isPhotosRevealed: false,
    extra: gqlUser.extra,
    interests: gqlUser.interests || ([] as string[]),
    user_prompts: gqlUser.user_prompts || ([] as string[]),
  };
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("none");

  const fetchProfile = async () => {
    try {
      const result = await graphqlAuthService.getMe();
      if (result.success && result.user) {
        setUser(convertToUserProfile(result.user));

        // Also fetch verification status if user is not verified
        if (!result.user.is_verified) {
          const verificationResult = await graphqlAuthService.getVerificationStatus();
          if (verificationResult.success && verificationResult.status) {
            // Map backend status to UI status
            const statusMap: Record<string, VerificationStatus> = {
              "PENDING": "pending",
              "APPROVED": "approved",
              "REJECTED": "rejected",
            };
            setVerificationStatus(statusMap[verificationResult.status] || "none");
          }
        } else {
          setVerificationStatus("approved");
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, []);

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
            router.replace("/(auth)/welcome");
          } catch (error) {
            console.error("Logout failed", error);
            logout();
            router.replace("/(auth)/welcome");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const calculateCompletion = () => {
    let score = 0;
    if (user?.firstName) score += 10;
    if (user?.bio && user.bio.length > 20) score += 20;
    if (user?.photos && user.photos.length >= 3) score += 25;
    else if (user?.photos && user.photos.length > 0) score += 10;
    if (user?.hobbies && user.hobbies.length >= 3) score += 15;
    if (user?.isVerified) score += 15;
    if (user?.extra?.work || user?.extra?.school) score += 10;
    if (user?.user_prompts && user.user_prompts.length > 0) score += 5;
    return Math.min(100, score);
  };

  const displayUser = user || {
    firstName: "User",
    photos: [],
    isVerified: false,
    bio: "",
    personalityTraits: {},
    extra: {},
    hobbies: [],
    interests: [],
    user_prompts: [],
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-transparent z-10">
          <Typography variant="h1" className="text-white">
            Profile
          </Typography>
          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          >
            <Settings size={22} color="#E6E6F0" />
          </Pressable>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6A1BFF"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <ProfileHeader
            user={displayUser}
            verificationStatus={verificationStatus}
            isOwnProfile
            onEditProfile={() => router.push("/(modals)/edit-profile")}
            onEditPhoto={() => router.push("/(modals)/edit-profile")}
            onStartVerification={() => setShowVerification(true)}
          />

          <CompletionMeter percent={calculateCompletion()} />

          {!displayUser.isVerified && (
            <View className="px-6 mb-6">
              <Pressable
                onPress={() => setShowVerification(true)}
                className="bg-[#6A1BFF]/20 border border-[#6A1BFF]/40 p-4 rounded-xl flex-row items-center justify-between"
              >
                <View>
                  <Typography
                    variant="h3"
                    className="text-white text-base mb-1"
                  >
                    Get Verified
                  </Typography>
                  <Typography variant="caption" className="text-white/60">
                    Unlock full features & trust badge
                  </Typography>
                </View>
                <View className="bg-[#6A1BFF] px-3 py-1.5 rounded-full">
                  <Typography
                    variant="caption"
                    className="text-white font-bold"
                  >
                    Start
                  </Typography>
                </View>
              </Pressable>
            </View>
          )}

          <BioSection
            bio={displayUser.bio}
            isOwnProfile
            onAIGenerate={() => router.push("/(modals)/edit-profile")} // Redirect to edit for AI generation
          />

          <View className="mt-2">
            <PhotoGrid photos={displayUser.photos} />
          </View>

          <PromptsDisplay prompts={displayUser.user_prompts || []} />

          <MetadataDisplay
            extra={displayUser.extra}
            hobbies={displayUser.hobbies}
            interests={displayUser.interests || []}
          />

          <View className="px-6 mt-6 mb-10">
            <Typography
              variant="caption"
              className="text-center text-white/30 mb-2"
            >
              Version {version} • Blindly
            </Typography>
            <Typography
              variant="caption"
              className="text-center text-pink-500 mb-6 underline"
              onPress={() =>
                Linking.openURL("https://github.com/mellob1989/blindly")
              }
            >
              Made with ❤️ by MelloB
            </Typography>
            <Button
              variant="secondary"
              className="w-full border border-red-500/30 bg-red-500/10"
              onPress={handleLogout}
              loading={isLoggingOut}
              icon={<LogOut size={18} color="#EF4444" />}
            >
              <Typography className="text-[#EF4444]">Log Out</Typography>
            </Button>
          </View>
        </ScrollView>

        <Modal
          visible={showSettings}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <GradientBackground>
            <View className="flex-1 p-6">
              <View className="flex-row justify-between items-center mb-8">
                <Typography variant="h1" className="text-white">
                  Settings
                </Typography>
                <Pressable
                  onPress={() => setShowSettings(false)}
                  className="p-2 bg-white/10 rounded-full"
                >
                  <X size={24} color="white" />
                </Pressable>
              </View>
              <Typography className="text-white/60">
                Settings functionality coming soon.
              </Typography>
            </View>
          </GradientBackground>
        </Modal>

        {/* Verification Modal */}
        <Modal
          visible={showVerification}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <VerificationFlow
            onCancel={() => setShowVerification(false)}
            onComplete={() => {
              setShowVerification(false);
              Alert.alert("Success", "Verification submitted successfully!");
              fetchProfile();
            }}
          />
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
