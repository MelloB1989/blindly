import React, { useState, useRef, useEffect } from "react";
import {
    View,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { ChevronLeft } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { login } = useStore();

    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRef = useRef<TextInput>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-submit when code is complete
    useEffect(() => {
        if (code.length === CODE_LENGTH) {
            handleVerify();
        }
    }, [code]);

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) {
            Alert.alert("Invalid Code", "Please enter the complete 6-digit code");
            return;
        }

        if (!email) {
            Alert.alert("Error", "Email not found. Please go back and try again.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await graphqlAuthService.verifyEmailLoginCode(email, code);

            if (result.success && result.user && result.accessToken) {
                // Transform GraphQL user to app UserProfile
                const userProfile = {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.first_name,
                    lastName: result.user.last_name,
                    bio: result.user.bio || "",
                    hobbies: result.user.hobbies || [],
                    personalityTraits: result.user.personality_traits
                        ? Object.fromEntries(
                            result.user.personality_traits.map((t) => [t.key, t.value]),
                        )
                        : {},
                    photos: result.user.photos || [],
                    isVerified: result.user.is_verified,
                    isPhotosRevealed: false,
                };

                login(userProfile, result.accessToken);

                // Check if user needs onboarding
                if (!result.user.hobbies || result.user.hobbies.length === 0) {
                    router.replace("/(auth)/hobbies" as Href);
                } else {
                    router.replace("/(tabs)/swipe" as Href);
                }
            } else {
                setCode("");
                Alert.alert(
                    "Verification Failed",
                    result.error || "Invalid or expired code. Please try again.",
                );
            }
        } catch (error) {
            console.error("Verification error:", error);
            setCode("");
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || resendCooldown > 0) return;

        setIsResending(true);
        try {
            const result = await graphqlAuthService.requestEmailLoginCode(email);

            if (result.success) {
                Alert.alert("Code Sent", "A new verification code has been sent to your email.");
                setResendCooldown(60); // 60 second cooldown
                setCode("");
            } else {
                Alert.alert("Failed to Resend", result.error || "Could not send code. Please try again.");
            }
        } catch (error) {
            console.error("Resend error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleCodeChange = (text: string) => {
        // Only allow numbers
        const numericText = text.replace(/[^0-9]/g, "");
        if (numericText.length <= CODE_LENGTH) {
            setCode(numericText);
        }
    };

    // Render individual code boxes
    const renderCodeBoxes = () => {
        const boxes = [];
        for (let i = 0; i < CODE_LENGTH; i++) {
            const digit = code[i] || "";
            const isFocused = code.length === i;

            boxes.push(
                <View
                    key={i}
                    className={`w-12 h-14 rounded-xl items-center justify-center mx-1 ${isFocused
                            ? "bg-primary/20 border-2 border-primary"
                            : digit
                                ? "bg-surface-elevated border-2 border-success"
                                : "bg-surface-elevated border border-border"
                        }`}
                >
                    <Typography variant="h2" className="text-2xl">
                        {digit}
                    </Typography>
                </View>,
            );
        }
        return boxes;
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <View className="flex-1 px-6 py-8">
                    {/* Header */}
                    <TouchableOpacity
                        onPress={handleBack}
                        className="flex-row items-center mb-8"
                    >
                        <ChevronLeft size={24} color="#E6E6F0" />
                        <Typography variant="body" className="ml-2">
                            Back
                        </Typography>
                    </TouchableOpacity>

                    {/* Title */}
                    <View className="mb-8">
                        <Typography variant="h1" className="text-2xl mb-2">
                            Enter Verification Code
                        </Typography>
                        <Typography variant="body" color="muted">
                            We sent a 6-digit code to
                        </Typography>
                        <Typography variant="label" color="primary" className="mt-1">
                            {email}
                        </Typography>
                    </View>

                    {/* Code Input */}
                    <View className="items-center mb-8">
                        <View className="flex-row justify-center">{renderCodeBoxes()}</View>

                        {/* Hidden actual input */}
                        <TextInput
                            ref={inputRef}
                            className="absolute opacity-0 w-full h-14"
                            value={code}
                            onChangeText={handleCodeChange}
                            keyboardType="number-pad"
                            maxLength={CODE_LENGTH}
                            autoComplete="one-time-code"
                        />
                    </View>

                    {/* Verify Button */}
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={handleVerify}
                        disabled={isLoading || code.length !== CODE_LENGTH}
                        className="w-full"
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            "Verify Code"
                        )}
                    </Button>

                    {/* Resend Code */}
                    <View className="items-center mt-6">
                        {resendCooldown > 0 ? (
                            <Typography variant="body" color="muted">
                                Resend code in {resendCooldown}s
                            </Typography>
                        ) : (
                            <TouchableOpacity onPress={handleResend} disabled={isResending}>
                                {isResending ? (
                                    <ActivityIndicator color="#7C3AED" size="small" />
                                ) : (
                                    <Typography variant="body" color="primary">
                                        Resend Code
                                    </Typography>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Info */}
                    <View className="mt-8 bg-surface-elevated rounded-xl p-4">
                        <Typography variant="caption" color="muted">
                            💡 Didn't receive the code? Check your spam folder or request a
                            new code.
                        </Typography>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
