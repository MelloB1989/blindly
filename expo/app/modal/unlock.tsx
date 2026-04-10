import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { LinearGradient } from "expo-linear-gradient";
import {
  Lock,
  Unlock,
  Shield,
  Check,
  MessageCircle,
  Camera,
  Sparkles,
  EyeOff,
} from "lucide-react-native";
import { chatService, Connection } from "../../services/chat-service";
import * as Haptics from "expo-haptics";

export default function UnlockModal() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [requestSent, setRequestSent] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real connection data
  useEffect(() => {
    const fetchConnection = async () => {
      if (!chatId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await chatService.getMyConnections();
        if (result.success && result.connections) {
          const conn = result.connections.find((c) => c.chat.id === chatId);
          if (conn) {
            setConnection(conn);
          }
        }
      } catch (error) {
        console.error("Failed to fetch connection:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConnection();
  }, [chatId]);

  const percentComplete = connection?.percentage_complete ?? 0;
  const isReady = percentComplete >= 99;
  const profileName = connection?.connection_profile?.name || "your match";

  const handleRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRequestSent(true);
    // TODO: Wire to real unlock request API when backend mutation is available
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View className="flex-1 items-center justify-center p-6">
        {/* Visual Icon */}
        <View className="mb-8 items-center">
          <View
            className="w-24 h-24 rounded-full items-center justify-center border-2 mb-6"
            style={{
              backgroundColor: requestSent
                ? "rgba(20,214,121,0.1)"
                : "rgba(124,58,237,0.1)",
              borderColor: requestSent
                ? "rgba(20,214,121,0.3)"
                : "rgba(124,58,237,0.3)",
            }}
          >
            {requestSent ? (
              <Check size={48} color="#14D679" />
            ) : isReady ? (
              <Camera size={48} color="#7C3AED" />
            ) : (
              <Lock size={48} color="#7C3AED" />
            )}
          </View>

          <Typography variant="h1" className="text-center mb-2 text-white">
            {requestSent
              ? "Request Sent!"
              : isReady
              ? "Reveal Photos?"
              : "Keep Chatting!"}
          </Typography>

          <Typography
            variant="body"
            color="muted"
            className="text-center max-w-[300px] leading-5"
          >
            {requestSent
              ? `Waiting for ${profileName} to accept. You'll be notified when photos are revealed.`
              : isReady
              ? `You and ${profileName} have chatted enough! Ready to see each other?`
              : `Chat more with ${profileName} to unlock photo reveal. Both of you need to reach the threshold.`}
          </Typography>
        </View>

        {/* Progress / Requirements */}
        {!requestSent && (
          <Card
            variant="elevated"
            className="w-full mb-8"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
            }}
          >
            <View className="p-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-2">
                  <MessageCircle size={14} color={isReady ? "#14D679" : "#A78BFA"} />
                  <Typography variant="label" className="text-white">
                    Conversation Progress
                  </Typography>
                </View>
                <Typography
                  variant="label"
                  style={{ color: isReady ? "#14D679" : "#A78BFA" }}
                  className="font-bold"
                >
                  {isReady ? "Ready!" : `${Math.round(percentComplete)}%`}
                </Typography>
              </View>

              {/* Progress Bar */}
              <View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#1C1433" }}>
                <LinearGradient
                  colors={isReady ? ["#14D679", "#10B981"] : ["#7C3AED", "#A78BFA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: "100%",
                    width: `${Math.min(percentComplete, 100)}%`,
                    borderRadius: 5,
                  }}
                />
              </View>

              {/* Milestone markers */}
              <View className="flex-row justify-between mt-2">
                {[0, 25, 50, 75, 100].map((mark) => (
                  <Typography
                    key={mark}
                    variant="caption"
                    className="text-[10px]"
                    style={{
                      color:
                        percentComplete >= mark
                          ? "rgba(167,139,250,0.6)"
                          : "rgba(255,255,255,0.15)",
                    }}
                  >
                    {mark}%
                  </Typography>
                ))}
              </View>

              {!isReady && (
                <View className="flex-row items-center mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <EyeOff size={12} color="rgba(255,255,255,0.3)" />
                  <Typography variant="caption" className="text-white/30 ml-2 text-[11px] flex-1">
                    Both you and {profileName} need to send messages. Keep the conversation going!
                  </Typography>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* How it works - when not ready */}
        {!requestSent && !isReady && (
          <View className="w-full mb-6">
            <Typography variant="label" className="text-white/40 uppercase tracking-wider text-[10px] mb-3 text-center">
              How Photo Reveal Works
            </Typography>
            <View className="gap-3">
              {[
                { step: "1", text: "Both send enough messages", icon: MessageCircle, color: "#A78BFA" },
                { step: "2", text: "Request photo reveal", icon: Camera, color: "#38BDF8" },
                { step: "3", text: "Rate each other 1-10", icon: Sparkles, color: "#FFD166" },
                { step: "4", text: "Both rate 8+? It's a Date!", icon: Check, color: "#14D679" },
              ].map((item) => (
                <View key={item.step} className="flex-row items-center gap-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={14} color={item.color} />
                  </View>
                  <Typography variant="body" className="text-white/60 text-sm">
                    {item.text}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="w-full gap-3">
          {!requestSent ? (
            <>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!isReady}
                onPress={handleRequest}
                icon={
                  <Unlock
                    size={20}
                    color={!isReady ? "#A6A6B2" : "#FFFFFF"}
                  />
                }
              >
                {isReady ? "Request to Reveal" : "Chat More to Unlock"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onPress={() => router.back()}
              >
                Maybe Later
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onPress={() => router.back()}
            >
              Back to Chat
            </Button>
          )}
        </View>

        {/* Safety Note */}
        <View className="flex-row items-center mt-8 opacity-60">
          <Shield size={14} color="#A6A6B2" />
          <Typography variant="caption" color="muted" className="ml-2">
            Your safety is our priority. Photos are private until unlocked.
          </Typography>
        </View>
      </View>
    </GradientBackground>
  );
}
