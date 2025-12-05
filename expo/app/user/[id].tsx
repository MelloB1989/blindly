import React from "react";
import {
  View,
  ScrollView,
  StatusBar,
  Image,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { MOCK_USERS } from "../../constants/mockData";
import {
  ArrowLeft,
  Heart,
  X,
  Sparkles,
  MapPin,
  Languages,
  Moon,
  CheckCircle2,
  Lock,
} from "lucide-react-native";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find user from mock data
  const user = MOCK_USERS.find((u) => u.id === id);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography variant="h3" color="muted">
          User not found
        </Typography>
        <Button
          variant="outline"
          onPress={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const isLocked = !user.isRevealed;

  const handleAction = (action: string) => {
    Alert.alert(action, `You ${action.toLowerCase()} ${user.firstName}!`);
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        <View className="relative">
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 }}>
            <Image
              source={{ uri: user.photos[0] }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {isLocked && (
              <View className="absolute inset-0 items-center justify-center">
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <View className="bg-surface-elevated/80 p-6 rounded-2xl items-center backdrop-blur-md border border-white/10">
                  <Lock size={32} color="#A6A6B2" className="mb-2" />
                  <Typography variant="h3" className="text-center mb-1">
                    Profile Locked
                  </Typography>
                  <Typography
                    variant="body"
                    color="muted"
                    className="text-center"
                  >
                    Match or chat to unlock photos
                  </Typography>
                </View>
              </View>
            )}
          </View>

          {/* Header Actions */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
            <View className="px-4 py-2 flex-row justify-between items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Name Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20">
            <View className="flex-row items-center gap-2 mb-1">
              <Typography variant="h1" className="text-3xl">
                {user.firstName}, {user.age}
              </Typography>
              {user.isVerified && (
                <CheckCircle2 size={24} color="#3B82F6" fill="#3B82F6" />
              )}
            </View>

            <View className="flex-row items-center gap-4 mb-2">
              {user.matchScore && (
                <Badge
                  label={`${user.matchScore}% Match`}
                  variant="ai"
                  icon={<Sparkles size={12} color="#FFD166" />}
                />
              )}
              <View className="flex-row items-center">
                <MapPin size={14} color="#A6A6B2" />
                <Typography variant="caption" color="muted" className="ml-1">
                  {user.distance} • {user.area}
                </Typography>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 py-6 gap-6 pb-32">
          {/* Bio */}
          {user.bio && (
            <View>
              <Typography variant="h3" className="mb-2">
                About
              </Typography>
              <Typography variant="body" className="leading-relaxed">
                {user.bio}
              </Typography>
            </View>
          )}

          {/* Basics */}
          <View className="flex-row flex-wrap gap-3">
            {user.zodiac && (
              <Chip
                label={user.zodiac}
                icon={<Moon size={14} color="#E6E6F0" />}
              />
            )}
            {user.languages?.map((lang) => (
              <Chip
                key={lang}
                label={lang}
                icon={<Languages size={14} color="#E6E6F0" />}
              />
            ))}
          </View>

          {/* Hobbies */}
          {user.hobbies && user.hobbies.length > 0 && (
            <View>
              <Typography variant="h3" className="mb-3">
                Interests
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.hobbies.map((hobby) => (
                  <Chip key={hobby} label={hobby} variant="outline" />
                ))}
              </View>
            </View>
          )}

          {/* Traits */}
          {user.traits && user.traits.length > 0 && (
            <View>
              <Typography variant="h3" className="mb-3">
                Personality
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {user.traits.map((trait) => (
                  <Chip key={trait} label={trait} variant="default" />
                ))}
              </View>
            </View>
          )}

          {/* Prompts */}
          {user.prompts &&
            user.prompts.map((prompt, index) => (
              <Card
                key={index}
                variant="elevated"
                padding="lg"
                className="border-l-4 border-l-primary"
              >
                <Typography
                  variant="label"
                  color="primary"
                  className="mb-2 uppercase tracking-wider"
                >
                  {prompt.question}
                </Typography>
                <Typography
                  variant="h3"
                  className="italic font-normal text-white/90"
                >
                  &quot;{prompt.answer}&quot;
                </Typography>
              </Card>
            ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView className="absolute bottom-0 left-0 right-0 bg-background/90 border-t border-surface-elevated backdrop-blur-xl">
        <View className="px-6 py-4 flex-row justify-center items-center gap-6">
          <Pressable
            onPress={() => handleAction("Passed")}
            className="w-14 h-14 rounded-full bg-surface-elevated items-center justify-center border border-danger/30 active:scale-95"
          >
            <X size={24} color="#EF4444" />
          </Pressable>

          <Pressable
            onPress={() => handleAction("Super Liked")}
            className="w-12 h-12 rounded-full bg-surface-elevated items-center justify-center border border-primary/30 active:scale-95"
          >
            <Sparkles size={20} color="#7C3AED" />
          </Pressable>

          <Pressable
            onPress={() => handleAction("Liked")}
            className="w-14 h-14 rounded-full bg-surface-elevated items-center justify-center border border-success/30 active:scale-95"
          >
            <Heart size={24} color="#16A34A" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
