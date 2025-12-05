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
import { Card } from "../../components/ui/Card";
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
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center">
          <Typography variant="h1">Profile</Typography>
          <Pressable
            onPress={() => setShowSettingsModal(true)}
            className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
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
              className="border-4 border-surface-elevated"
            />
            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-background">
              <Camera size={16} color="#FFFFFF" />
            </View>
          </Pressable>

          <View className="flex-row items-center gap-2 mb-1">
            <Typography variant="h2">
              {displayUser.firstName}
              {displayUser.age ? `, ${displayUser.age}` : ""}
            </Typography>
            {displayUser.isVerified && (
              <CheckCircle2 size={20} color="#16A34A" fill="#16A34A" />
            )}
          </View>

          {user?.email && (
            <Typography variant="caption" color="muted">
              {user.email}
            </Typography>
          )}

          <Button
            variant="secondary"
            size="sm"
            onPress={handleEditProfile}
            className="mt-3"
            icon={<Edit3 size={14} color="#E6E6F0" />}
          >
            Edit Profile
          </Button>
        </View>

        {/* Stats / Quick Actions */}
        <View className="flex-row px-6 gap-3 mb-6">
          <Card className="flex-1 items-center py-4" variant="elevated">
            <View className="flex-row items-center gap-1 mb-1">
              <Typography variant="h2" color="primary">
                {completionPercentage}%
              </Typography>
            </View>
            <Typography variant="caption" color="muted">
              Profile Complete
            </Typography>
            <View className="w-full h-1 bg-surface rounded-full mt-2 overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </View>
          </Card>
          <Card className="flex-1 items-center py-4" variant="elevated">
            <View className="flex-row items-center gap-1 mb-1">
              <Heart size={16} color="#FFD166" />
              <Typography variant="h2" color="ai">
                12
              </Typography>
            </View>
            <Typography variant="caption" color="muted">
              Matches
            </Typography>
          </Card>
        </View>

        {/* Bio Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Typography variant="h3">Bio</Typography>
            <Pressable
              onPress={handleAIBioRewrite}
              className="flex-row items-center bg-ai/10 px-3 py-1.5 rounded-full"
            >
              <Sparkles size={14} color="#FFD166" />
              <Typography variant="caption" color="ai" className="ml-1.5">
                AI Rewrite
              </Typography>
            </Pressable>
          </View>
          <Card variant="elevated" padding="md">
            <Typography variant="body" className="leading-relaxed">
              {displayUser.bio || "Add a bio to tell people about yourself!"}
            </Typography>
          </Card>
        </View>

        {/* Hobbies & Traits */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Typography variant="h3">Interests</Typography>
            <Pressable>
              <Typography variant="caption" color="primary">
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
              <Typography variant="body" color="muted">
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

          <Typography variant="h3" className="mb-3">
            Personality
          </Typography>
          <View className="flex-row flex-wrap gap-2">
            {getTraitLabels().length > 0 ? (
              getTraitLabels().map((trait) => (
                <Badge key={trait} label={trait} variant="default" size="md" />
              ))
            ) : (
              <Typography variant="body" color="muted">
                Complete the personality quiz to show your traits
              </Typography>
            )}
          </View>
        </View>

        {/* Quick Settings */}
        <View className="px-6 mb-6">
          <Typography variant="h3" className="mb-3">
            Quick Settings
          </Typography>

          <Card variant="elevated" className="mb-3">
            <View className="flex-row justify-between items-center p-4">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-10 h-10 rounded-full bg-ai/10 items-center justify-center">
                  <Sparkles size={18} color="#FFD166" />
                </View>
                <View className="flex-1">
                  <Typography variant="body">AI Features</Typography>
                  <Typography variant="caption" color="muted">
                    Smart suggestions & matching
                  </Typography>
                </View>
              </View>
              <Switch
                value={aiEnabled}
                onValueChange={setAiEnabled}
                trackColor={{ false: "#16161B", true: "#7C3AED" }}
                thumbColor={"#E6E6F0"}
              />
            </View>
          </Card>

          <Pressable>
            <Card variant="elevated" className="mb-3">
              <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Eye size={18} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <Typography variant="body">Photo Visibility</Typography>
                    <Typography variant="caption" color="muted">
                      Hidden until you unlock
                    </Typography>
                  </View>
                </View>
                <ChevronRight size={20} color="#A6A6B2" />
              </View>
            </Card>
          </Pressable>

          <Pressable>
            <Card variant="elevated">
              <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center">
                    <Shield size={18} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Typography variant="body">Safety Center</Typography>
                    <Typography variant="caption" color="muted">
                      Block, report & privacy settings
                    </Typography>
                  </View>
                </View>
                <ChevronRight size={20} color="#A6A6B2" />
              </View>
            </Card>
          </Pressable>
        </View>

        {/* Logout Button */}
        <View className="px-6 mb-8">
          <Button
            variant="secondary"
            className="w-full border border-danger/30 bg-danger/10"
            onPress={handleLogout}
            loading={isLoggingOut}
            icon={<LogOut size={18} color="#EF4444" />}
          >
            <Typography color="danger">Log Out</Typography>
          </Button>
        </View>

        {/* App Info */}
        <View className="items-center mb-8">
          <Typography variant="caption" color="muted">
            Blindly v1.0.0
          </Typography>
          <Typography variant="caption" color="muted" className="mt-1">
            Made with 💜 for meaningful connections
          </Typography>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-elevated">
            <Typography variant="h2">Settings</Typography>
            <Pressable
              onPress={() => setShowSettingsModal(false)}
              className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
            >
              <X size={22} color="#E6E6F0" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Account Section */}
            <Typography
              variant="label"
              color="muted"
              className="mb-3 uppercase tracking-wider"
            >
              Account
            </Typography>

            <Card variant="elevated" className="mb-6">
              <Pressable className="flex-row items-center p-4 border-b border-surface">
                <Edit3 size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Edit Profile
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable className="flex-row items-center p-4 border-b border-surface">
                <Bell size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Notifications
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable className="flex-row items-center p-4">
                <Lock size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Privacy
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
            </Card>

            {/* Support Section */}
            <Typography
              variant="label"
              color="muted"
              className="mb-3 uppercase tracking-wider"
            >
              Support
            </Typography>

            <Card variant="elevated" className="mb-6">
              <Pressable className="flex-row items-center p-4 border-b border-surface">
                <HelpCircle size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Help Center
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable className="flex-row items-center p-4 border-b border-surface">
                <Shield size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Safety & Reporting
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable className="flex-row items-center p-4">
                <MessageCircle size={20} color="#E6E6F0" />
                <Typography variant="body" className="flex-1 ml-3">
                  Contact Us
                </Typography>
                <ChevronRight size={20} color="#A6A6B2" />
              </Pressable>
            </Card>

            {/* Danger Zone */}
            <Typography
              variant="label"
              color="muted"
              className="mb-3 uppercase tracking-wider"
            >
              Danger Zone
            </Typography>

            <Card variant="elevated">
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center p-4"
              >
                <LogOut size={20} color="#EF4444" />
                <Typography
                  variant="body"
                  color="danger"
                  className="flex-1 ml-3"
                >
                  Log Out
                </Typography>
              </Pressable>
            </Card>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
