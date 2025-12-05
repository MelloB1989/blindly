import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import {
  ChevronLeft,
  Send,
  Sparkles,
  Lock,
  Unlock,
  MoreVertical,
  X,
} from "lucide-react-native";
import { AI_RIZZ_SUGGESTIONS } from "../../constants/mockData";
import {
  chatService,
  ChatWebSocket,
  Message,
  Connection,
} from "../../services/chat-service";
import { getCurrentUserId } from "../../utils/jwt";
import * as ChatDB from "../../services/chat-db";

type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [inputText, setInputText] = useState("");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const seenSentRef = useRef(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const uid = await getCurrentUserId();
      setCurrentUserId(uid);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchConnection = async () => {
      const result = await chatService.getMyConnections();
      if (result.success && result.connections) {
        const conn = result.connections.find((c) => c.chat.id === chatId);
        if (conn) {
          setConnection(conn);
        }
      }
    };
    fetchConnection();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || Platform.OS === "web") {
      setCacheLoaded(true);
      return;
    }

    const loadCache = async () => {
      const cached = await ChatDB.getMessages(chatId, 50);
      if (cached.length > 0) {
        setMessages(cached);
      }
      setCacheLoaded(true);
    };
    loadCache();
  }, [chatId]);

  const isValidMessage = (message: Message): boolean => {
    const hasContent = message.content && message.content.trim().length > 0;
    const hasMedia = message.media && message.media.length > 0;
    return hasContent || hasMedia;
  };

  const sendSeenEvent = useCallback((msgs: Message[], userId: string) => {
    if (!wsRef.current || seenSentRef.current) return;

    const unseenFromOther = msgs
      .filter((m) => !m.id.startsWith("temp-") && m.sender_id !== userId && !m.seen)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (unseenFromOther.length > 0) {
      wsRef.current.markMessagesSeen([unseenFromOther[0].id]);
      seenSentRef.current = true;

      if (chatId && Platform.OS !== "web") {
        ChatDB.markAllSeenBefore(chatId, unseenFromOther[0].id);
      }
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const ws = new ChatWebSocket(chatId);
    wsRef.current = ws;

    ws.onConnected = () => {
      setIsConnecting(false);
      setIsConnected(true);
      ws.queryMessages(50);
    };

    ws.onDisconnected = () => {
      setIsConnected(false);
    };

    ws.onMessage = (message: Message) => {
      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => m.id === message.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }

        if (!isValidMessage(message)) {
          return prev;
        }

        const tempIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") &&
            m.content === message.content &&
            m.sender_id === message.sender_id
        );
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = message;
          if (chatId && Platform.OS !== "web") {
            ChatDB.saveMessage(chatId, message);
          }
          return updated;
        }

        if (chatId && Platform.OS !== "web") {
          ChatDB.saveMessage(chatId, message);
        }
        return [...prev, message];
      });
    };

    ws.onMessagesLoaded = (loadedMessages: Message[]) => {
      const validMessages = loadedMessages.filter(isValidMessage);
      const uniqueMessages = new Map<string, Message>();

      for (const msg of validMessages) {
        uniqueMessages.set(msg.id, msg);
      }

      const sortedMessages = Array.from(uniqueMessages.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages((prev) => {
        const merged = new Map<string, Message>();
        for (const msg of prev) {
          if (!msg.id.startsWith("temp-")) {
            merged.set(msg.id, msg);
          }
        }
        for (const msg of sortedMessages) {
          merged.set(msg.id, msg);
        }
        return Array.from(merged.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      if (chatId && Platform.OS !== "web" && sortedMessages.length > 0) {
        ChatDB.saveMessages(chatId, sortedMessages);
      }

      setHasMoreMessages(sortedMessages.length >= 50);
    };

    ws.onTypingStarted = () => {
      setOtherUserTyping(true);
    };

    ws.onTypingStopped = () => {
      setOtherUserTyping(false);
    };

    ws.onError = () => {
      setIsConnecting(false);
    };

    ws.connect();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    if (!isConnected || !currentUserId || messages.length === 0) return;
    sendSeenEvent(messages, currentUserId);
  }, [isConnected, currentUserId, messages, sendSeenEvent]);

  const handleBack = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current && wsRef.current) {
      wsRef.current.stopTyping();
    }
    router.back();
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text && !isTypingRef.current) {
      isTypingRef.current = true;
      setIsTyping(true);
      wsRef.current?.startTyping();
    }

    if (!text && isTypingRef.current) {
      isTypingRef.current = false;
      setIsTyping(false);
      wsRef.current?.stopTyping();
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        setIsTyping(false);
        wsRef.current?.stopTyping();
      }
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim() || !wsRef.current || !isConnected || !currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      setIsTyping(false);
      wsRef.current.stopTyping();
    }

    const createdAt = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      type: "TEXT",
      content: inputText.trim(),
      sender_id: currentUserId,
      received: false,
      seen: false,
      media: [],
      reactions: [],
      created_at: createdAt,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setShowAiSuggestions(false);

    wsRef.current.sendMessage({
      type: "TEXT",
      content: newMessage.content,
      created_at: createdAt,
    });
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreMessages || !wsRef.current || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];

    if (Platform.OS !== "web" && chatId) {
      const olderCached = await ChatDB.getMessages(chatId, 50, oldestMessage.id);
      if (olderCached.length > 0) {
        setMessages((prev) => [...olderCached, ...prev]);
        setIsLoadingMore(false);
        setHasMoreMessages(olderCached.length >= 50);
        return;
      }
    }

    wsRef.current.queryMessages(50, oldestMessage.id);
    setIsLoadingMore(false);
  };

  const handleAiSuggest = () => {
    setShowAiSuggestions(true);
    setIsLoadingAi(true);

    setTimeout(() => {
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
    if (!connection) return;

    if (connection.percentage_complete < 1) {
      Alert.alert(
        "Not Yet!",
        `Keep chatting to unlock photos. You're ${Math.round(connection.percentage_complete * 100)}% there!`
      );
      return;
    }

    Alert.alert(
      "Request Photo Reveal",
      `Ask ${connection.connection_profile.name} to reveal photos? They'll need to accept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Request",
          onPress: () => {
            Alert.alert(
              "Request Sent!",
              "You'll be notified when they respond."
            );
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;

    return (
      <View className={`mb-3 ${isMe ? "items-end" : "items-start"} px-4`}>
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe
            ? "bg-primary rounded-br-sm"
            : "bg-surface-elevated rounded-bl-sm"
            }`}
        >
          <Typography variant="body" className={isMe ? "text-white" : ""}>
            {item.content}
          </Typography>
        </View>
        <View className="flex-row items-center mt-1 gap-1">
          <Typography variant="caption" color="muted">
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
          {isMe && item.seen && (
            <Typography variant="caption" color="primary">
              ✓✓
            </Typography>
          )}
          {isMe && !item.seen && item.received && (
            <Typography variant="caption" color="muted">
              ✓
            </Typography>
          )}
        </View>
      </View>
    );
  };

  if ((isConnecting && !connection) || !cacheLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Typography variant="body" color="muted" className="mt-4">
          Connecting to chat...
        </Typography>
      </SafeAreaView>
    );
  }

  if (!connection) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Typography variant="h2">Chat not found</Typography>
        <Button variant="primary" onPress={handleBack} className="mt-4">
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const profile = connection.connection_profile;
  const isUnlocked = connection.match.is_unlocked;
  const progressPercent = connection.percentage_complete;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center px-4 py-3 border-b border-surface-elevated">
          <Pressable onPress={handleBack} className="mr-3 p-1">
            <ChevronLeft size={28} color="#E6E6F0" />
          </Pressable>

          <Pressable className="flex-row items-center flex-1">
            <Avatar
              source={isUnlocked ? profile.pfp : undefined}
              fallback={profile.name}
              locked={!isUnlocked}
              size="md"
              className="mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Typography variant="h3" className="text-lg">
                  {profile.name}
                </Typography>
                {profile.is_online && (
                  <View className="w-2 h-2 rounded-full bg-success ml-2" />
                )}
              </View>
              <View className="flex-row items-center">
                {isUnlocked ? (
                  <View className="flex-row items-center">
                    <Unlock size={12} color="#16A34A" />
                    <Typography
                      variant="caption"
                      color="success"
                      className="ml-1"
                    >
                      Photos Unlocked
                    </Typography>
                  </View>
                ) : otherUserTyping ? (
                  <Typography variant="caption" color="primary">
                    typing...
                  </Typography>
                ) : (
                  <View className="flex-row items-center">
                    <Lock size={12} color="#A6A6B2" />
                    <Typography
                      variant="caption"
                      color="muted"
                      className="ml-1"
                    >
                      {progressPercent}% to unlock
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </Pressable>

          {!isUnlocked && (
            <Pressable
              onPress={handleUnlockRequest}
              className={`px-3 py-2 rounded-full ${connection.percentage_complete >= 1
                ? "bg-primary"
                : "bg-surface-elevated"
                }`}
            >
              <View className="flex-row items-center">
                <Unlock
                  size={16}
                  color={
                    connection.percentage_complete >= 1 ? "#FFFFFF" : "#A6A6B2"
                  }
                />
              </View>
            </Pressable>
          )}

          <Pressable className="ml-2 p-1">
            <MoreVertical size={24} color="#A6A6B2" />
          </Pressable>
        </View>

        {!isConnected && !isConnecting && (
          <View className="bg-error/20 px-4 py-2">
            <Typography
              variant="caption"
              color="danger"
              className="text-center"
            >
              Connection lost. Reconnecting...
            </Typography>
          </View>
        )}

        {!isUnlocked && (
          <View className="px-4 py-2 bg-surface">
            <View className="flex-row items-center justify-between mb-1">
              <Typography variant="caption" color="muted">
                Progress to unlock photos
              </Typography>
              <Typography variant="caption" color="primary">
                {progressPercent}%
              </Typography>
            </View>
            <View className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.min(progressPercent, 100)}%`,
                }}
              />
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          inverted
          removeClippedSubviews={Platform.OS !== "web"}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Typography variant="body" color="muted">
                Say hello! 👋
              </Typography>
            </View>
          }
        />

        {otherUserTyping && (
          <View className="px-4 pb-2">
            <View className="flex-row items-center">
              <View className="bg-surface-elevated rounded-2xl px-4 py-2">
                <Typography variant="caption" color="muted">
                  {profile.name} is typing...
                </Typography>
              </View>
            </View>
          </View>
        )}

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

        <View className="px-4 py-3 border-t border-surface-elevated bg-surface">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleAiSuggest}
              className="w-10 h-10 rounded-full bg-ai/20 items-center justify-center active:bg-ai/30"
            >
              <Sparkles size={20} color="#FFD166" />
            </Pressable>

            <View className="flex-1 flex-row items-center bg-surface-elevated rounded-full px-4 py-2">
              <TextInput
                value={inputText}
                onChangeText={handleInputChange}
                placeholder="Type a message..."
                placeholderTextColor="#A6A6B2"
                className="flex-1 text-body text-base py-1"
                style={{ color: "#E6E6F0" }}
                multiline
                maxLength={500}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || !isConnected}
              className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() && isConnected
                ? "bg-primary active:bg-primary/80"
                : "bg-surface-elevated"
                }`}
            >
              <Send
                size={20}
                color={inputText.trim() && isConnected ? "#FFFFFF" : "#A6A6B2"}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
