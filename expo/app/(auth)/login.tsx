import React, { useState } from "react";
import {
    View,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { useRouter, Href } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { graphqlAuthService } from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Missing Fields", "Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            const result = await graphqlAuthService.loginWithPassword(
                email.trim(),
                password,
            );

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

                // Check onboarding status and navigate accordingly
                const status = graphqlAuthService.getOnboardingStatus(result.user);
                if (status.nextScreen) {
                    router.replace(status.nextScreen as Href);
                } else {
                    router.replace("/(tabs)/swipe" as Href);
                }
            } else {
                Alert.alert(
                    "Login Failed",
                    result.error || "Invalid email or password",
                );
            }
        } catch (error) {
            console.error("Login error:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = () => {
        router.push("/(auth)/email-login" as Href);
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
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
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
                                Welcome Back
                            </Typography>
                            <Typography variant="body" color="muted">
                                Sign in to continue your journey
                            </Typography>
                        </View>

                        {/* Form */}
                        <View className="space-y-4">
                            {/* Email Input */}
                            <View className="mb-4">
                                <Typography variant="label" className="mb-2">
                                    Email
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
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View className="mb-6">
                                <Typography variant="label" className="mb-2">
                                    Password
                                </Typography>
                                <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                    <Lock size={20} color="#6B6B80" />
                                    <TextInput
                                        className="flex-1 ml-3 text-text-primary text-base"
                                        placeholder="Enter your password"
                                        placeholderTextColor="#6B6B80"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoComplete="password"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} color="#6B6B80" />
                                        ) : (
                                            <Eye size={20} color="#6B6B80" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button */}
                            <Button
                                variant="primary"
                                size="lg"
                                onPress={handleLogin}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    "Sign In"
                                )}
                            </Button>

                            {/* Divider */}
                            <View className="flex-row items-center my-6">
                                <View className="flex-1 h-[1px] bg-border" />
                                <Typography variant="caption" color="muted" className="mx-4">
                                    or
                                </Typography>
                                <View className="flex-1 h-[1px] bg-border" />
                            </View>

                            {/* Email Login Code */}
                            <Button
                                variant="secondary"
                                size="lg"
                                onPress={handleEmailLogin}
                                className="w-full"
                            >
                                Sign in with Email Code
                            </Button>
                        </View>

                        {/* Sign Up Link */}
                        <View className="flex-row justify-center mt-8">
                            <Typography variant="body" color="muted">
                                Don't have an account?{" "}
                            </Typography>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/signup" as Href)}
                            >
                                <Typography variant="body" color="primary">
                                    Sign Up
                                </Typography>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
