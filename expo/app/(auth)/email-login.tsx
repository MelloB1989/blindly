import React, { useState } from "react";
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
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { ChevronLeft, Mail } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";

export default function EmailLoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestCode = async () => {
        if (!email.trim()) {
            Alert.alert("Missing Email", "Please enter your email address");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            const result = await graphqlAuthService.requestEmailLoginCode(
                email.trim().toLowerCase(),
            );

            if (result.success) {
                // Navigate to verification screen with email
                // Using type assertion as typed routes haven't been regenerated yet
                router.push(
                    `/(auth)/verify-code?email=${encodeURIComponent(email.trim().toLowerCase())}` as Href
                );
            } else {
                Alert.alert(
                    "Failed to Send Code",
                    result.error || "Could not send verification code. Please try again.",
                );
            }
        } catch (error) {
            console.error("Request code error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
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
                            Sign in with Email
                        </Typography>
                        <Typography variant="body" color="muted">
                            We'll send you a verification code to sign in without a password
                        </Typography>
                    </View>

                    {/* Form */}
                    <View className="flex-1">
                        {/* Email Input */}
                        <View className="mb-6">
                            <Typography variant="label" className="mb-2">
                                Email Address
                            </Typography>
                            <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                <Mail size={20} color="#6B6B80" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-primary text-base"
                                    placeholder="Enter your email"
                                    placeholderTextColor="#6B6B80"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoComplete="email"
                                    autoFocus
                                />
                            </View>
                        </View>

                        {/* Send Code Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            onPress={handleRequestCode}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                "Send Verification Code"
                            )}
                        </Button>

                        {/* Info */}
                        <View className="mt-6 bg-surface-elevated rounded-xl p-4">
                            <Typography variant="caption" color="muted">
                                💡 Check your inbox for a 6-digit code. The code expires in 10
                                minutes.
                            </Typography>
                        </View>
                    </View>

                    {/* Password Login Link */}
                    <View className="flex-row justify-center mt-auto pt-8">
                        <Typography variant="body" color="muted">
                            Prefer to use a password?{" "}
                        </Typography>
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/login" as Href)}
                        >
                            <Typography variant="body" color="primary">
                                Sign In
                            </Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
