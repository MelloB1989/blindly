import React, { useState, useRef, useEffect } from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import {
  ChevronLeft,
  Send,
  Sparkles,
  Lock,
  Unlock,
  MoreVertical,
  X,
} from "lucide-react-native";
import { MOCK_CHATS, getUserById, AI_RIZZ_SUGGESTIONS } from "../../constants/mockData";
import { useStore } from "../../store/useStore";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isAiSuggested: boolean;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { addMessage } = useStore();

  // Find the chat from mock data
  const chat = MOCK_CHATS.find((c) => c.id === id);
  const otherUser = chat ? getUserById(chat.userId) : null;

  const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
  const [inputText, setInputText] = useState("");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const messagesCount = messages.length;
  const messagesRequired = chat?.messagesRequired || 20;
  const canUnlock = messagesCount >= messagesRequired;
  const isUnlocked = otherUser?.isRevealed || false;

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleBack = () => {
    router.back();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      text: inputText.trim(),
      senderId: "me",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isAiSuggested: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setShowAiSuggestions(false);

    // Simulate a reply after a delay
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const replyMessage: Message = {
          id: `m${Date.now() + 1}`,
          text: getRandomReply(),
          senderId: chat?.userId || "other",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isAiSuggested: false,
        };
        setMessages((prev) => [...prev, replyMessage]);
      }, 1500 + Math.random() * 2000);
    }
  };

  const getRandomReply = () => {
    const replies = [
      "That's really interesting!",
      "I totally agree with you on that.",
      "Haha, you're funny! 😄",
      "Tell me more about that!",
      "I've been thinking the same thing lately.",
      "That's a great point!",
      "I'd love to hear more about your thoughts on this.",
      "Wow, I never thought about it that way.",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const handleAiSuggest = () => {
    setShowAiSuggestions(true);
    setIsLoadingAi(true);

    // Simulate AI loading
    setTimeout(() => {
      // Get 3 random suggestions
      const shuffled = [...AI_RIZZ_SUGGESTIONS].sort(() => 0.5 - Math.random());
      setAiSuggestions(shuffled.slice(0, 3));
      setIsLoadingAi(false);
    }, 800);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    setShowAiSuggestions(false);
  };

  const handleUnlockRequest = () => {
    if (!canUnlock) {
      Alert.alert(
        "Not Yet!",
        `Send ${messagesRequired - messagesCount} more messages to unlock photos.`,
      );
      return;
    }

    Alert.alert(
      "Request Photo Reveal",
      `Ask ${otherUser?.firstName} to reveal photos? They'll need to accept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Request",
          onPress: () => {
            Alert.alert("Request Sent!", "You'll be notified when they respond.");
          },
        },
      ],
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === "me";

    return (
      <View
        className={`mb-3 ${isMe ? "items-end" : "items-start"} px-4`}
      >
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isMe
              ? "bg-primary rounded-br-sm"
              : "bg-surface-elevated rounded-bl-sm"
          }`}
        >
          <Typography variant="body" className={isMe ? "text-white" : ""}>
            {item.text}
          </Typography>
        </View>
        <View className="flex-row items-center mt-1 gap-1">
          <Typography variant="caption" color="muted">
            {item.timestamp}
          </Typography>
          {item.isAiSuggested && (
            <View className="flex-row items-center">
              <Sparkles size={10} color="#FFD166" />
              <Typography variant="caption" color="ai" className="ml-0.5">
                AI
              </Typography>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!chat || !otherUser) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography variant="h2">Chat not found</Typography>
        <Button variant="primary" onPress={handleBack} className="mt-4">
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-surface-elevated">
          <Pressable onPress={handleBack} className="mr-3 p-1">
            <ChevronLeft size={28} color="#E6E6F0" />
          </Pressable>

          <Pressable className="flex-row items-center flex-1">
            <Avatar
              source={isUnlocked ? otherUser.photos[0] : undefined}
              fallback={otherUser.firstName}
              locked={!isUnlocked}
              size="md"
              className="mr-3"
            />
            <View className="flex-1">
              <Typography variant="h3" className="text-lg">
                {otherUser.firstName}
              </Typography>
              <View className="flex-row items-center">
                {isUnlocked ? (
                  <View className="flex-row items-center">
                    <Unlock size={12} color="#16A34A" />
                    <Typography variant="caption" color="success" className="ml-1">
                      Photos Unlocked
                    </Typography>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Lock size={12} color="#A6A6B2" />
                    <Typography variant="caption" color="muted" className="ml-1">
                      {messagesCount}/{messagesRequired} messages
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </Pressable>

          {!isUnlocked && (
            <Pressable
              onPress={handleUnlockRequest}
              className={`px-3 py-2 rounded-full ${
                canUnlock ? "bg-primary" : "bg-surface-elevated"
              }`}
            >
              <View className="flex-row items-center">
                <Unlock size={16} color={canUnlock ? "#FFFFFF" : "#A6A6B2"} />
              </View>
            </Pressable>
          )}

          <Pressable className="ml-2 p-1">
            <MoreVertical size={24} color="#A6A6B2" />
          </Pressable>
        </View>

        {/* Progress Bar (only show if not unlocked) */}
        {!isUnlocked && (
          <View className="px-4 py-2 bg-surface">
            <View className="flex-row items-center justify-between mb-1">
              <Typography variant="caption" color="muted">
                Progress to unlock photos
              </Typography>
              <Typography variant="caption" color="primary">
                {Math.round((messagesCount / messagesRequired) * 100)}%
              </Typography>
            </View>
            <View className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.min((messagesCount / messagesRequired) * 100, 100)}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* AI Suggestions */}
        {showAiSuggestions && (
          <View className="px-4 pb-2">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Sparkles size={16} color="#FFD166" />
                <Typography variant="label" color="ai" className="ml-2">
                  AI Rizz Suggestions
                </Typography>
              </View>
              <Pressable onPress={() => setShowAiSuggestions(false)}>
                <X size={20} color="#A6A6B2" />
              </Pressable>
            </View>

            {isLoadingAi ? (
              <View className="bg-surface-elevated rounded-xl p-4">
                <Typography variant="body" color="muted">
                  Thinking of something smooth...
                </Typography>
              </View>
            ) : (
              <View className="gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    className="bg-surface-elevated rounded-xl p-3 active:bg-surface border border-ai/20"
                  >
                    <Typography variant="body">{suggestion}</Typography>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-surface-elevated bg-surface">
          <View className="flex-row items-center gap-2">
            {/* AI Suggest Button */}
            <Pressable
              onPress={handleAiSuggest}
              className="w-10 h-10 rounded-full bg-ai/20 items-center justify-center active:bg-ai/30"
            >
              <Sparkles size={20} color="#FFD166" />
            </Pressable>

            {/* Text Input */}
            <View className="flex-1 flex-row items-center bg-surface-elevated rounded-full px-4 py-2">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#A6A6B2"
                className="flex-1 text-body text-base py-1"
                style={{ color: "#E6E6F0" }}
                multiline
                maxLength={500}
              />
            </View>

            {/* Send Button */}
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim()
                  ? "bg-primary active:bg-primary/80"
                  : "bg-surface-elevated"
              }`}
            >
              <Send
                size={20}
                color={inputText.trim() ? "#FFFFFF" : "#A6A6B2"}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
