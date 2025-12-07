import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  PostCard,
  CreatePostModal,
  UploadProgressBar,
} from "../../components/community";
import { useCommunityStore, Post } from "../../store/useCommunityStore";
import { getCurrentUserId } from "../../utils/jwt";
import { Hand } from "lucide-react-native";
import { GradientBackground } from "../../components/ui/GradientBackground";

export default function SocialScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    posts,
    isLoadingPosts,
    isLoadingMorePosts,
    hasMorePosts,
    postsError,
    pendingUpload,
    fetchFeedPosts,
    loadMorePosts,
    createPost,
    togglePostLike,
    deletePost,
    reportContent,
    pokeUser,
  } = useCommunityStore();

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    fetchFeedPosts();
  }, [fetchFeedPosts]);

  const handleRefresh = useCallback(() => {
    fetchFeedPosts(true);
  }, [fetchFeedPosts]);

  const handleLoadMore = useCallback(() => {
    if (hasMorePosts && !isLoadingMorePosts) {
      loadMorePosts();
    }
  }, [hasMorePosts, isLoadingMorePosts, loadMorePosts]);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/community/${postId}`);
  }, []);

  const handleCreatePost = useCallback(
    (
      content: string,
      files?: { uri: string; type?: "image" | "video" | "audio" | "file" }[],
    ) => {
      createPost(content, files);
    },
    [createPost],
  );

  const handlePoke = useCallback(
    async (userId: string) => {
      const success = await pokeUser(userId);
      if (success) {
        Alert.alert("Poked! 👋", "They'll know you're interested!");
      } else {
        Alert.alert("Oops", "Couldn't send poke. Try again!");
      }
    },
    [pokeUser],
  );

  const handleReport = useCallback(
    async (postId: string) => {
      Alert.prompt(
        "Report Post",
        "Why are you reporting this post?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            onPress: async (reason: string | undefined) => {
              if (reason?.trim()) {
                const success = await reportContent(postId, reason);
                if (success) {
                  Alert.alert(
                    "Reported",
                    "Thanks for keeping our community safe!",
                  );
                }
              }
            },
          },
        ],
        "plain-text",
      );
    },
    [reportContent],
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const success = await deletePost(postId);
      if (success) {
        Alert.alert("Deleted", "Your post has been removed.");
      } else {
        Alert.alert("Error", "Couldn't delete post. Try again!");
      }
    },
    [deletePost],
  );

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/user/${userId}`);
  }, []);

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <PostCard
        post={item}
        index={index}
        currentUserId={currentUserId || undefined}
        onPress={() => handlePostPress(item.id)}
        onLike={() => togglePostLike(item.id)}
        onComment={() => handlePostPress(item.id)}
        onUserPress={() => handleUserPress(item.user_id)}
        onPoke={() => handlePoke(item.user_id)}
        onReport={() => handleReport(item.id)}
        onDelete={() => handleDeletePost(item.id)}
      />
    ),
    [
      currentUserId,
      handlePostPress,
      handleUserPress,
      togglePostLike,
      handlePoke,
      handleReport,
      handleDeletePost,
    ],
  );

  const renderHeader = () => (
    <>
      <UploadProgressBar upload={pendingUpload} />

      <View className="mx-4 mt-4 mb-2">
        <Card variant="elevated" padding="md" className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-[#7C3AED]/20 items-center justify-center mr-3">
            <Hand size={20} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Typography variant="label" className="text-white font-semibold">
              Poke to Connect
            </Typography>
            <Typography variant="caption" className="text-white/50">
              Interested in someone? Poke them to let them know!
            </Typography>
          </View>
        </Card>
      </View>
    </>
  );

  const renderEmpty = () => {
    if (isLoadingPosts) {
      return (
        <View className="py-16 items-center">
          <ActivityIndicator size="large" color="#6A1BFF" />
          <Typography variant="body" className="text-white/50 mt-4">
            Loading posts...
          </Typography>
        </View>
      );
    }

    if (postsError) {
      return (
        <View className="py-16 items-center px-8">
          <Typography variant="h3" className="text-white/70 text-center mb-2">
            Something went wrong
          </Typography>
          <Typography variant="body" className="text-white/50 text-center mb-4">
            {postsError}
          </Typography>
          <Button variant="primary" onPress={handleRefresh}>
            Try Again
          </Button>
        </View>
      );
    }

    return (
      <View className="py-16 items-center px-8">
        <Typography variant="h3" className="text-white/70 text-center mb-2">
          No posts yet
        </Typography>
        <Typography variant="body" className="text-white/50 text-center">
          Be the first to share something with the community!
        </Typography>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMorePosts) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#6A1BFF" />
        </View>
      );
    }
    return null;
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="px-4 py-4 border-b border-white/5 flex-row justify-between items-center">
          <View>
            <Typography variant="h1" className="text-white">
              Community
            </Typography>
            <Typography variant="caption" className="text-white/50">
              Connect through shared interests
            </Typography>
          </View>
          <Button
            variant="primary"
            size="sm"
            className="h-9"
            onPress={() => setShowCreatePost(true)}
          >
            <Typography variant="label" className="text-white font-semibold">
              + Post
            </Typography>
          </Button>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingPosts && posts.length > 0}
              onRefresh={handleRefresh}
              tintColor="#6A1BFF"
              colors={["#6A1BFF"]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />

        <CreatePostModal
          visible={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}
