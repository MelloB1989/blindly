import React, { useState } from "react";
import {
  View,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { MOCK_CHATS, MOCK_USERS, getUserById } from "../../constants/mockData";
import {
  Lock,
  Unlock,
  Hand,
  Eye,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react-native";
import { BlurView } from "expo-blur";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabType = "messages" | "pokes" | "views";

export default function ChatScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [pokeFilter, setPokeFilter] = useState<"received" | "sent">("received");
  const [viewFilter, setViewFilter] = useState<"viewed_you" | "you_viewed">(
    "viewed_you",
  );

  const handleTabChange = (tab: TabType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}` as Href);
  };

  const handleProfilePress = (userId: string) => {
    router.push(`/user/${userId}` as Href);
  };

  // --- Render Components ---

  const renderMessageItem = ({ item }: { item: (typeof MOCK_CHATS)[0] }) => {
    const otherUser = getUserById(item.userId);
    if (!otherUser) return null;

    const progressPercent = Math.round(
      (item.messagesCount / item.messagesRequired) * 100,
    );

    return (
      <Pressable
        onPress={() => handleChatPress(item.id)}
        className="flex-row items-center p-4 border-b border-surface-elevated active:bg-surface-elevated/50"
      >
        <View className="mr-4">
          <Avatar
            source={otherUser.isRevealed ? otherUser.photos[0] : undefined}
            fallback={otherUser.firstName}
            locked={!otherUser.isRevealed}
            size="md"
          />
        </View>
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-baseline mb-1">
            <View className="flex-row items-center gap-2">
              <Typography variant="h3" className="text-base">
                {otherUser.firstName}
              </Typography>
              {item.canUnlock && !otherUser.isRevealed && (
                <Badge
                  label="Can Unlock"
                  variant="ai"
                  size="sm"
                  icon={<Unlock size={8} color="#FFD166" />}
                />
              )}
            </View>
            <Typography variant="caption" color="muted">
              {item.updatedAt}
            </Typography>
          </View>
          <View className="flex-row justify-between items-center">
            <Typography
              variant="body"
              color={item.unreadCount > 0 ? "default" : "muted"}
              numberOfLines={1}
              className="flex-1 mr-4 text-sm"
            >
              {item.lastMessage}
            </Typography>
            {item.unreadCount > 0 && (
              <Badge
                label={item.unreadCount}
                variant="primary"
                size="sm"
                className="min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full"
              />
            )}
          </View>

          {/* Enhanced Unlock Progress */}
          {!otherUser.isRevealed && (
            <View className="mt-3 bg-surface-elevated/50 p-2 rounded-lg border border-white/5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Lock size={12} color="#A6A6B2" />
                  <Typography variant="caption" className="font-medium">
                    Unlock Photos
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color={item.canUnlock ? "primary" : "muted"}
                  className="font-bold"
                >
                  {item.messagesCount}/{item.messagesRequired} msgs
                </Typography>
              </View>
              <View className="h-1.5 bg-surface rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${
                    item.canUnlock ? "bg-primary" : "bg-primary/50"
                  }`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderInteractionItem = ({
    item,
    type,
    direction,
  }: {
    item: (typeof MOCK_USERS)[0];
    type: "poke" | "view";
    direction: "incoming" | "outgoing";
  }) => {
    // Simulate locked state (most are locked initially)
    const isLocked = !item.isRevealed;

    return (
      <Pressable
        onPress={() => handleProfilePress(item.id)}
        className="flex-row items-center p-4 border-b border-surface-elevated active:bg-surface-elevated/50"
      >
        <View className="mr-4 relative">
          <View className="w-14 h-14 rounded-full overflow-hidden bg-surface-elevated border border-white/10">
            {/* Image (Blurred if locked) */}
            <Image
              source={{ uri: item.photos[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {isLocked && (
              <View className="absolute inset-0 bg-primary/30 items-center justify-center overflow-hidden">
                {/* Blue effect overlay */}
                <BlurView
                  intensity={40}
                  tint="dark"
                  className="absolute inset-0"
                />
                <Lock size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
          {/* Type Icon Badge */}
          <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border-2 border-background items-center justify-center shadow-sm">
            {type === "poke" ? (
              <Hand size={12} color="#7C3AED" />
            ) : (
              <Eye size={12} color="#3B82F6" />
            )}
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Typography variant="h3" className="text-base">
              {item.firstName}, {item.age}
            </Typography>
            <Typography variant="caption" color="muted">
              {type === "poke" ? "2h ago" : "1d ago"}
            </Typography>
          </View>
          <View className="flex-row items-center mt-1">
            {direction === "incoming" ? (
              <ArrowDownLeft
                size={14}
                color={type === "poke" ? "#7C3AED" : "#3B82F6"}
                className="mr-1"
              />
            ) : (
              <ArrowUpRight size={14} color="#A6A6B2" className="mr-1" />
            )}
            <Typography variant="body" color="muted">
              {type === "poke"
                ? direction === "incoming"
                  ? "Poked you! 👋"
                  : "You poked them"
                : direction === "incoming"
                  ? "Viewed your profile"
                  : "You viewed them"}
            </Typography>
          </View>
        </View>

        <View className="ml-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onPress={() => handleProfilePress(item.id)}
          >
            <Typography variant="label" color="primary">
              View
            </Typography>
          </Button>
        </View>
      </Pressable>
    );
  };

  // --- Mock Data for Tabs ---
  // Using MOCK_USERS to simulate pokes/views
  const receivedPokes = MOCK_USERS.slice(0, 2);
  const sentPokes = MOCK_USERS.slice(2, 4);
  const viewedYou = MOCK_USERS.slice(2, 4);
  const youViewed = MOCK_USERS.slice(4, 6);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header & Tabs */}
      <View className="bg-background z-10 shadow-sm">
        <View className="px-4 py-3 border-b border-surface-elevated">
          <Typography variant="h1">Connections</Typography>
        </View>

        {/* Custom Tab Bar */}
        <View className="flex-row px-2 pt-2">
          {[
            { key: "messages", label: "Messages", icon: MessageCircle },
            { key: "pokes", label: "Pokes", icon: Hand },
            { key: "views", label: "Views", icon: Eye },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabChange(tab.key as TabType)}
                className="flex-1 items-center py-3 relative"
              >
                <View className="flex-row items-center gap-2 mb-1">
                  <Icon size={18} color={isActive ? "#7C3AED" : "#A6A6B2"} />
                  <Typography
                    variant="label"
                    className={
                      isActive ? "text-primary font-bold" : "text-muted"
                    }
                  >
                    {tab.label}
                  </Typography>
                </View>
                {isActive && (
                  <View className="absolute bottom-0 w-full h-0.5 bg-primary rounded-full" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sub-Filters */}
      {activeTab !== "messages" && (
        <View className="px-4 py-2 bg-background border-b border-surface-elevated flex-row gap-2">
          {activeTab === "pokes" ? (
            <>
              <Button
                variant={pokeFilter === "received" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setPokeFilter("received")}
                className="h-8"
              >
                Received
              </Button>
              <Button
                variant={pokeFilter === "sent" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setPokeFilter("sent")}
                className="h-8"
              >
                Sent
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={viewFilter === "viewed_you" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setViewFilter("viewed_you")}
                className="h-8"
              >
                Viewed You
              </Button>
              <Button
                variant={viewFilter === "you_viewed" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setViewFilter("you_viewed")}
                className="h-8"
              >
                You Viewed
              </Button>
            </>
          )}
        </View>
      )}

      {/* Content Area */}
      <View className="flex-1">
        {activeTab === "messages" &&
          (MOCK_CHATS.length > 0 ? (
            <FlatList
              data={MOCK_CHATS}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No Conversations"
              message="Match with someone to start chatting!"
              action={() => router.push("/(tabs)/swipe" as Href)}
            />
          ))}

        {activeTab === "pokes" && (
          <FlatList
            data={pokeFilter === "received" ? receivedPokes : sentPokes}
            renderItem={({ item }) =>
              renderInteractionItem({
                item,
                type: "poke",
                direction: pokeFilter === "received" ? "incoming" : "outgoing",
              })
            }
            keyExtractor={(item) => `poke-${item.id}`}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon={Hand}
                title={
                  pokeFilter === "received"
                    ? "No Pokes Received"
                    : "No Pokes Sent"
                }
                message={
                  pokeFilter === "received"
                    ? "Send pokes to get noticed!"
                    : "Go poke someone!"
                }
              />
            }
          />
        )}

        {activeTab === "views" && (
          <FlatList
            data={viewFilter === "viewed_you" ? viewedYou : youViewed}
            renderItem={({ item }) =>
              renderInteractionItem({
                item,
                type: "view",
                direction:
                  viewFilter === "viewed_you" ? "incoming" : "outgoing",
              })
            }
            keyExtractor={(item) => `view-${item.id}`}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon={Eye}
                title={
                  viewFilter === "viewed_you"
                    ? "No Views Yet"
                    : "You haven't viewed anyone"
                }
                message={
                  viewFilter === "viewed_you"
                    ? "Optimize your profile to get more views."
                    : "Start swiping to view profiles!"
                }
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const EmptyState = ({ icon: Icon, title, message, action }: any) => (
  <View className="flex-1 items-center justify-center px-8 py-16">
    <View className="w-20 h-20 rounded-full bg-surface-elevated items-center justify-center mb-4">
      <Icon size={40} color="#7C3AED" />
    </View>
    <Typography variant="h2" className="text-center mb-2">
      {title}
    </Typography>
    <Typography variant="body" color="muted" className="text-center mb-6">
      {message}
    </Typography>
    {action && (
      <Button variant="primary" onPress={action}>
        Start Swiping
      </Button>
    )}
  </View>
);
