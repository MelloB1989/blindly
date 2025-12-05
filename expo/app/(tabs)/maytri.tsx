import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StatusBar,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Chip } from "../../components/ui/Chip";
import { useStore, MaytriMessage } from "../../store/useStore";
import { MOCK_USERS } from "../../constants/mockData";
import {
  Send,
  Sparkles,
  Heart,
  Star,
  Info,
  History,
  Plus,
} from "lucide-react-native";

const INITIAL_MESSAGES: MaytriMessage[] = [
  {
    id: "welcome",
    type: "ai",
    text: "Hey there! 💜 I'm Maytri, your AI matchmaker and love guru. I'm here to help you find meaningful connections based on personality, not just looks.\n\nTell me about yourself - what are you looking for in a partner? Or ask me anything about dating!",
    timestamp: new Date().toISOString(),
    quickReplies: [
      "Help me find my match",
      "Give me dating advice",
      "What makes a good bio?",
      "I'm feeling lonely",
    ],
  },
];

const AI_RESPONSES: Record<
  string,
  { text: string; showRecs?: boolean; quickReplies?: string[] }
> = {
  "help me find my match": {
    text: "I'd love to help you find your perfect match! 🔮\n\nLet me ask you a few questions to understand what you're looking for:\n\nWhat qualities matter most to you in a partner? Are you drawn to someone creative and spontaneous, or do you prefer someone more grounded and organized?",
    quickReplies: [
      "Creative & spontaneous",
      "Grounded & organized",
      "A mix of both",
      "I'm not sure yet",
    ],
  },
  "creative & spontaneous": {
    text: "Ooh, you like adventure! I love that energy! 🎨✨\n\nBased on your preference for creative and spontaneous personalities, I've found some profiles that might catch your interest. These people love exploring new ideas and aren't afraid to be themselves!",
    showRecs: true,
    quickReplies: [
      "Tell me more about them",
      "Show different profiles",
      "What else should I consider?",
    ],
  },
  "grounded & organized": {
    text: "Stability is so important! Someone who has their life together can be incredibly attractive. 🌳\n\nHere are some profiles of people who are reliable, thoughtful, and know what they want. They might be perfect for building something real!",
    showRecs: true,
    quickReplies: [
      "Tell me more about them",
      "Show different profiles",
      "Any dating tips?",
    ],
  },
  "a mix of both": {
    text: "Balance is key! You want someone who can plan a cozy dinner at home but also say yes to a spontaneous road trip. 🌟\n\nLet me find people who embody that beautiful balance...",
    showRecs: true,
    quickReplies: [
      "These look great!",
      "Show more options",
      "How do I stand out?",
    ],
  },
  "give me dating advice": {
    text: "I've got plenty of wisdom to share! 💫\n\nThe most important thing in dating on Blindly is authenticity. Since photos are hidden initially, your personality and how you express yourself become everything.\n\nHere are my top 3 tips:\n\n1️⃣ Be genuinely curious about others - ask meaningful questions\n2️⃣ Share your passions openly - enthusiasm is attractive\n3️⃣ Don't rush the photo reveal - connection first!\n\nWhat specific area would you like advice on?",
    quickReplies: [
      "How to start conversations",
      "Making my profile stand out",
      "When to reveal photos",
      "Dealing with rejection",
    ],
  },
  "what makes a good bio?": {
    text: 'Great question! A killer bio is your secret weapon on Blindly. 📝✨\n\nHere\'s the formula:\n\n🎯 Start with something unique about you (not generic!)\n💭 Show your personality through humor or vulnerability\n🎣 End with a conversation starter\n\nAvoid: "Just ask me!" or listing your height/job\n\nInstead of: "I like traveling and food"\nTry: "Currently planning my 5th trip to Japan because I\'m convinced the perfect ramen exists and I WILL find it 🍜"\n\nWant me to help you brainstorm ideas for your bio?',
    quickReplies: [
      "Yes, help me write one!",
      "Show me good examples",
      "What about prompts?",
    ],
  },
  "i'm feeling lonely": {
    text: "I hear you, and I want you to know that feeling lonely is completely valid. 💜\n\nLoneliness isn't a flaw - it's a sign that you're ready for deeper connection. And that's exactly what Blindly is about.\n\nRemember:\n• Quality connections take time\n• Being single doesn't define your worth\n• Every great love story started with two strangers\n\nYou're taking a brave step by being here. Would you like me to suggest some profiles of people who might understand what you're going through?",
    quickReplies: [
      "Yes, show me profiles",
      "More encouragement please",
      "Tips for putting myself out there",
    ],
  },
  "how to start conversations": {
    text: 'Starting conversations is an art! Here\'s my playbook: 🎯\n\n✅ DO:\n• Reference something specific from their bio\n• Ask open-ended questions\n• Share a related personal story\n• Use humor if it feels natural\n\n❌ DON\'T:\n• Start with "hey" or "hi"\n• Ask yes/no questions\n• Copy-paste the same opener\n\nExample: If they love hiking, try:\n"I saw you\'re into hiking! I just discovered this hidden waterfall trail - always looking for adventure buddies. What\'s been your favorite hike so far?"\n\nWant to practice? Tell me about someone you matched with!',
    quickReplies: [
      "Show me a profile to practice",
      "More examples please",
      "What if they don't respond?",
    ],
  },
  "analyze compatibility": {
    text: "Based on their profile, you two seem to have a lot in common! 🧩\n\nYour shared interest in [Interest] is a great foundation. They also value [Trait], which complements your [Trait].\n\nI'd give this match a solid 85% compatibility score. Definitely worth sending a message!",
    quickReplies: [
      "Suggest an opener",
      "What should I ask?",
      "Show me similar profiles",
    ],
  },
  "conversation starters": {
    text: 'Here are a few openers tailored for them: 🗣️\n\n1. "I noticed you\'re into [Hobby]. Have you ever tried [Related Activity]?"\n2. "Your prompt about [Topic] really caught my eye. I feel the same way!"\n3. "If you could be anywhere right now, where would you go?"\n\nWhich one feels most like you?',
    quickReplies: ["Option 1", "Option 2", "Option 3", "Give me more"],
  },
  default: {
    text: "That's a great point! 💭\n\nI think the key here is being authentic and patient. The best connections on Blindly happen when people focus on genuine compatibility rather than rushing things.\n\nIs there anything specific about dating or finding a match that I can help you with?",
    quickReplies: ["Find me matches", "Dating tips", "Help with my profile"],
  },
};

export default function MaytriScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ profileName?: string }>();
  const {
    maytriMessages,
    addMaytriMessage,
    setMaytriMessages,
    saveMaytriSession,
    clearMaytriMessages,
  } = useStore();
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (maytriMessages.length === 0) {
      setMaytriMessages(INITIAL_MESSAGES);
    }
  }, [maytriMessages.length, setMaytriMessages]);

  useEffect(() => {
    if (params.profileName) {
      const contextMessage: MaytriMessage = {
        id: `ctx-${Date.now()}`,
        type: "ai",
        text: `I see you're interested in ${params.profileName}! 🌟\n\nThey seem like a great catch. What would you like to know about them? I can analyze their compatibility with you or suggest some conversation starters!`,
        timestamp: new Date().toISOString(),
        quickReplies: [
          "Analyze compatibility",
          "Conversation starters",
          "What's their vibe?",
        ],
      };
      addMaytriMessage(contextMessage);
    }
  }, [params.profileName, addMaytriMessage]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [maytriMessages]);

  const getAIResponse = (
    userMessage: string,
  ): { text: string; showRecs?: boolean; quickReplies?: string[] } => {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Check for exact or partial matches
    for (const [key, response] of Object.entries(AI_RESPONSES)) {
      if (key !== "default" && lowerMessage.includes(key.toLowerCase())) {
        return response;
      }
    }

    // Check for keywords
    if (
      lowerMessage.includes("match") ||
      lowerMessage.includes("find") ||
      lowerMessage.includes("recommend")
    ) {
      return {
        text: "Let me find some great matches for you! 🔍\n\nBased on what you've told me, here are some people I think you'd really connect with. Remember, on Blindly it's all about personality first!",
        showRecs: true,
        quickReplies: [
          "Tell me more about them",
          "Different profiles please",
          "What do we have in common?",
        ],
      };
    }

    if (
      lowerMessage.includes("advice") ||
      lowerMessage.includes("tip") ||
      lowerMessage.includes("help")
    ) {
      return AI_RESPONSES["give me dating advice"];
    }

    if (lowerMessage.includes("bio") || lowerMessage.includes("profile")) {
      return AI_RESPONSES["what makes a good bio?"];
    }

    if (
      lowerMessage.includes("lonely") ||
      lowerMessage.includes("sad") ||
      lowerMessage.includes("anxious")
    ) {
      return AI_RESPONSES["i'm feeling lonely"];
    }

    return AI_RESPONSES.default;
  };

  const getRandomRecommendations = () => {
    const shuffled = [...MOCK_USERS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const handleSend = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: MaytriMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    addMaytriMessage(userMessage);
    setInputText("");
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(
      () => {
        const aiResponse = getAIResponse(messageText);

        const aiMessage: MaytriMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          text: aiResponse.text,
          timestamp: new Date().toISOString(),
          recommendations: aiResponse.showRecs
            ? (getRandomRecommendations() as any)
            : undefined,
          quickReplies: aiResponse.quickReplies,
        };

        addMaytriMessage(aiMessage);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    );
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const renderMessage = ({ item }: { item: MaytriMessage }) => {
    const isUser = item.type === "user";

    return (
      <View className={`mb-4 ${isUser ? "items-end" : "items-start"} px-4`}>
        {/* AI Avatar */}
        {!isUser && (
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2 overflow-hidden border border-primary">
              <Image
                source={require("../../assets/maytri.jpg")}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <Typography variant="label" color="primary">
              Maytri
            </Typography>
          </View>
        )}

        {/* Message Bubble */}
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary rounded-br-sm"
              : "bg-surface-elevated rounded-bl-sm"
          }`}
        >
          <Typography variant="body" className={isUser ? "text-white" : ""}>
            {item.text}
          </Typography>
        </View>

        {/* Profile Recommendations */}
        {item.recommendations && item.recommendations.length > 0 && (
          <View className="mt-3 w-full">
            <Typography variant="label" color="muted" className="mb-2">
              Recommended for you:
            </Typography>
            {item.recommendations.map((profile) => (
              <Card
                key={profile.id}
                variant="elevated"
                padding="md"
                className="mb-2"
              >
                <View className="flex-row items-center">
                  <Avatar
                    fallback={profile.firstName}
                    locked={!profile.isRevealed}
                    size="md"
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Typography variant="label">
                        {profile.firstName}, {profile.age}
                      </Typography>
                      <Badge
                        label={`${profile.matchScore}%`}
                        variant="ai"
                        size="sm"
                        icon={<Star size={8} color="#FFD166" />}
                      />
                    </View>
                    <Typography
                      variant="caption"
                      color="muted"
                      numberOfLines={1}
                    >
                      {profile.bio.substring(0, 60)}...
                    </Typography>
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {profile.hobbies.slice(0, 3).map((hobby) => (
                        <Chip
                          key={hobby}
                          label={hobby}
                          variant="outline"
                          className="py-0.5 px-2"
                        />
                      ))}
                    </View>
                  </View>
                  <Pressable className="p-2">
                    <Heart size={20} color="#7C3AED" />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Replies */}
        {item.quickReplies && item.quickReplies.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3 max-w-[90%]">
            {item.quickReplies.map((reply, index) => (
              <Pressable
                key={index}
                onPress={() => handleQuickReply(reply)}
                className="bg-surface border border-primary/30 rounded-full px-4 py-2 active:bg-primary/20"
              >
                <Typography variant="caption" color="primary">
                  {reply}
                </Typography>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-surface-elevated">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3 border-2 border-primary overflow-hidden">
              <Image
                source={require("../../assets/maytri.jpg")}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Typography variant="h2" className="text-lg">
                  Maytri
                </Typography>
                <Badge label="AI" variant="ai" size="sm" />
              </View>
              <Typography variant="caption" color="muted">
                Your AI matchmaker & love guru
              </Typography>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push("/maytri-history" as Href)}
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                <History size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (maytriMessages.length > 1) {
                    saveMaytriSession({
                      id: `session-${Date.now()}`,
                      title:
                        maytriMessages[1]?.text.slice(0, 30) + "..." ||
                        "New Chat",
                      date: new Date().toISOString(),
                      messages: maytriMessages,
                    });
                  }
                  clearMaytriMessages();
                  setMaytriMessages(INITIAL_MESSAGES);
                }}
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                <Plus size={20} color="#A6A6B2" />
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "About Maytri",
                    "Maytri is your AI dating assistant designed to help you find meaningful connections.",
                  )
                }
                className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
              >
                <Info size={20} color="#A6A6B2" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={maytriMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View className="px-4 mb-2">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
                <Sparkles size={16} color="#FFFFFF" />
              </View>
              <View className="bg-surface-elevated rounded-2xl rounded-bl-sm px-4 py-3">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                  <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                  <View className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-surface-elevated bg-surface">
          <View className="flex-row items-center gap-2">
            {/* Text Input */}
            <View className="flex-1 flex-row items-center bg-surface-elevated rounded-full px-4 py-2">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask Maytri anything..."
                placeholderTextColor="#A6A6B2"
                className="flex-1 text-body text-base py-1"
                style={{ color: "#E6E6F0" }}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
            </View>

            {/* Send Button */}
            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              className={`w-11 h-11 rounded-full items-center justify-center ${
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

          {/* Powered by AI notice */}
          <View className="flex-row items-center justify-center mt-2">
            <Sparkles size={12} color="#FFD166" />
            <Typography
              variant="caption"
              color="muted"
              className="ml-1 text-xs"
            >
              Powered by AI • Your conversations help improve recommendations
            </Typography>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
