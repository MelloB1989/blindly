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
import {
    ChevronLeft,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    Calendar,
} from "lucide-react-native";
import { graphqlAuthService, CreateUserInput } from "../../services/graphql-auth";
import { useStore } from "../../store/useStore";

export default function SignupScreen() {
    const router = useRouter();
    const { login } = useStore();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [dob, setDob] = useState(""); // Format: YYYY-MM-DD
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (): string | null => {
        if (!firstName.trim()) return "First name is required";
        if (!lastName.trim()) return "Last name is required";
        if (!email.trim()) return "Email is required";
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        if (password !== confirmPassword) return "Passwords do not match";
        if (!dob) return "Date of birth is required";

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dob)) return "Date must be in YYYY-MM-DD format";

        // Validate age (must be 18+)
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) return "You must be 18 or older to sign up";

        return null;
    };

    const handleSignup = async () => {
        const validationError = validateForm();
        if (validationError) {
            Alert.alert("Validation Error", validationError);
            return;
        }

        setIsLoading(true);
        try {
            const input: CreateUserInput = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim().toLowerCase(),
                password: password,
                dob: new Date(dob).toISOString(),
            };

            const result = await graphqlAuthService.createUser(input);

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

                // Navigate to onboarding
                router.replace("/(auth)/hobbies" as Href);
            } else {
                Alert.alert(
                    "Signup Failed",
                    result.error || "Could not create account. Please try again.",
                );
            }
        } catch (error) {
            console.error("Signup error:", error);
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
                                Create Account
                            </Typography>
                            <Typography variant="body" color="muted">
                                Start your journey to meaningful connections
                            </Typography>
                        </View>

                        {/* Form */}
                        <View className="space-y-4">
                            {/* Name Row */}
                            <View className="flex-row space-x-3 mb-4">
                                <View className="flex-1">
                                    <Typography variant="label" className="mb-2">
                                        First Name
                                    </Typography>
                                    <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                        <User size={20} color="#6B6B80" />
                                        <TextInput
                                            className="flex-1 ml-3 text-text-primary text-base"
                                            placeholder="First"
                                            placeholderTextColor="#6B6B80"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            autoCapitalize="words"
                                            autoComplete="given-name"
                                        />
                                    </View>
                                </View>

                                <View className="flex-1 ml-3">
                                    <Typography variant="label" className="mb-2">
                                        Last Name
                                    </Typography>
                                    <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                        <TextInput
                                            className="flex-1 text-text-primary text-base"
                                            placeholder="Last"
                                            placeholderTextColor="#6B6B80"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            autoCapitalize="words"
                                            autoComplete="family-name"
                                        />
                                    </View>
                                </View>
                            </View>

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

                            {/* Date of Birth */}
                            <View className="mb-4">
                                <Typography variant="label" className="mb-2">
                                    Date of Birth
                                </Typography>
                                <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                    <Calendar size={20} color="#6B6B80" />
                                    <TextInput
                                        className="flex-1 ml-3 text-text-primary text-base"
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#6B6B80"
                                        value={dob}
                                        onChangeText={setDob}
                                        keyboardType="numbers-and-punctuation"
                                    />
                                </View>
                                <Typography variant="caption" color="muted" className="mt-1">
                                    You must be 18 or older to use Blindly
                                </Typography>
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <Typography variant="label" className="mb-2">
                                    Password
                                </Typography>
                                <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                    <Lock size={20} color="#6B6B80" />
                                    <TextInput
                                        className="flex-1 ml-3 text-text-primary text-base"
                                        placeholder="At least 8 characters"
                                        placeholderTextColor="#6B6B80"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoComplete="new-password"
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

                            {/* Confirm Password */}
                            <View className="mb-6">
                                <Typography variant="label" className="mb-2">
                                    Confirm Password
                                </Typography>
                                <View className="flex-row items-center bg-surface-elevated rounded-xl px-4 py-3">
                                    <Lock size={20} color="#6B6B80" />
                                    <TextInput
                                        className="flex-1 ml-3 text-text-primary text-base"
                                        placeholder="Confirm your password"
                                        placeholderTextColor="#6B6B80"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                        autoComplete="new-password"
                                    />
                                </View>
                            </View>

                            {/* Create Account Button */}
                            <Button
                                variant="primary"
                                size="lg"
                                onPress={handleSignup}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </View>

                        {/* Sign In Link */}
                        <View className="flex-row justify-center mt-8">
                            <Typography variant="body" color="muted">
                                Already have an account?{" "}
                            </Typography>
                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/login" as Href)}
                            >
                                <Typography variant="body" color="primary">
                                    Sign In
                                </Typography>
                            </TouchableOpacity>
                        </View>

                        {/* Terms */}
                        <Typography
                            variant="caption"
                            color="muted"
                            className="text-center mt-6 opacity-60"
                        >
                            By creating an account, you agree to our Terms of Service and
                            Privacy Policy.
                        </Typography>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
