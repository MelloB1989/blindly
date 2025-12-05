import React, { useState } from "react";
import {
  View,
  FlatList,
  StatusBar,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "../../components/ui/Typography";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { MOCK_POSTS } from "../../constants/mockData";
import {
  Heart,
  MessageSquare,
  Repeat,
  MoreHorizontal,
  Hand,
  X,
  Sparkles,
  Image as ImageIcon,
  Send,
} from "lucide-react-native";

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string | null;
  };
  text: string;
  timestamp: string;
}

interface Post {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    isRevealed: boolean;
  };
  content: string;
  media?: string[];
  timestamp: string;
  likes: number;
  comments: number;
  reposts: number;
  isLiked: boolean;
  isReposted: boolean;
  commentsList?: Comment[];
}

export default function SocialScreen() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedUser, setSelectedUser] = useState<Post["user"] | null>(null);
  const [showPokeModal, setShowPokeModal] = useState(false);

  // Comments state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const handleUserPress = (user: Post["user"]) => {
    setSelectedUser(user);
    setShowPokeModal(true);
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      }),
    );
  };

  const handleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isReposted: !post.isReposted,
            reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1,
          };
        }
        return post;
      }),
    );
  };

  const handleComment = (postId: string) => {
    setActivePostId(postId);
    setShowCommentsModal(true);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !activePostId) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      user: {
        name: "You",
        avatar: null,
      },
      text: commentText,
      timestamp: "Just now",
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === activePostId) {
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [newComment, ...(post.commentsList || [])],
          };
        }
        return post;
      }),
    );
    setCommentText("");
  };

  const handlePoke = () => {
    if (selectedUser) {
      Alert.alert(
        "Poke Sent! 👋",
        `${selectedUser.name} will see your profile and can decide to connect with you.`,
        [{ text: "OK", onPress: () => setShowPokeModal(false) }],
      );
    }
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: `p${Date.now()}`,
      user: {
        id: "me",
        name: "You",
        avatar: null,
        isRevealed: false,
      },
      content: newPostContent,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      reposts: 0,
      isLiked: false,
      isReposted: false,
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostContent("");
    setShowCreatePost(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View className="border-b border-surface-elevated px-4 py-4">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <Pressable
          className="flex-row items-center flex-1"
          onPress={() => handleUserPress(item.user)}
        >
          <Avatar
            source={
              item.user.isRevealed ? item.user.avatar || undefined : undefined
            }
            fallback={item.user.name}
            locked={!item.user.isRevealed}
            size="md"
            className="mr-3"
          />
          <View>
            <View className="flex-row items-center gap-2">
              <Typography variant="label" className="font-bold">
                {item.user.name}
              </Typography>
              {!item.user.isRevealed && (
                <Badge label="Hidden" variant="default" size="sm" />
              )}
            </View>
            <Typography variant="caption" color="muted">
              {item.timestamp}
            </Typography>
          </View>
        </Pressable>

        <Pressable className="p-2">
          <MoreHorizontal size={20} color="#A6A6B2" />
        </Pressable>
      </View>

      {/* Content */}
      <Typography variant="body" className="mb-3 leading-relaxed">
        {item.content}
      </Typography>

      {/* Media */}
      {item.media && item.media.length > 0 && (
        <View className="mb-3 rounded-xl overflow-hidden h-64 bg-surface-elevated">
          <Image
            source={{ uri: item.media[0] }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      )}

      {/* Actions */}
      <View className="flex-row justify-between items-center mt-2 pr-4">
        {/* Like */}
        <Pressable
          onPress={() => handleLike(item.id)}
          className="flex-row items-center gap-2 py-2 pr-4"
        >
          <Heart
            size={20}
            color={item.isLiked ? "#EF4444" : "#A6A6B2"}
            fill={item.isLiked ? "#EF4444" : "transparent"}
          />
          <Typography
            variant="caption"
            color={item.isLiked ? "danger" : "muted"}
          >
            {item.likes}
          </Typography>
        </Pressable>

        {/* Comment */}
        <Pressable
          onPress={() => handleComment(item.id)}
          className="flex-row items-center gap-2 py-2 pr-4"
        >
          <MessageSquare size={20} color="#A6A6B2" />
          <Typography variant="caption" color="muted">
            {item.comments}
          </Typography>
        </Pressable>

        {/* Repost */}
        <Pressable
          onPress={() => handleRepost(item.id)}
          className="flex-row items-center gap-2 py-2 pr-4"
        >
          <Repeat size={20} color={item.isReposted ? "#16A34A" : "#A6A6B2"} />
          <Typography
            variant="caption"
            color={item.isReposted ? "success" : "muted"}
          >
            {item.reposts}
          </Typography>
        </Pressable>

        {/* Quick Poke Action */}
        <Pressable
          onPress={() => handleUserPress(item.user)}
          className="flex-row items-center gap-2 py-2"
        >
          <Hand size={20} color="#7C3AED" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-surface-elevated flex-row justify-between items-center">
        <View>
          <Typography variant="h1">Community</Typography>
          <Typography variant="caption" color="muted">
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

      {/* Info Banner */}
      <View className="mx-4 mt-4 mb-2">
        <Card variant="elevated" padding="md" className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Hand size={20} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Typography variant="label">Poke to Connect</Typography>
            <Typography variant="caption" color="muted">
              Interested in someone? Poke them to let them know!
            </Typography>
          </View>
        </Card>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-elevated">
            <Pressable onPress={() => setShowCreatePost(false)}>
              <X size={24} color="#E6E6F0" />
            </Pressable>
            <Typography variant="h3">New Post</Typography>
            <Button
              variant="primary"
              size="sm"
              onPress={handleCreatePost}
              disabled={!newPostContent.trim()}
            >
              Post
            </Button>
          </View>

          <View className="flex-1 px-4 py-4">
            <View className="flex-row items-start">
              <Avatar fallback="Y" size="md" className="mr-3" />
              <TextInput
                value={newPostContent}
                onChangeText={setNewPostContent}
                placeholder="What's on your mind?"
                placeholderTextColor="#A6A6B2"
                multiline
                autoFocus
                className="flex-1 text-body text-base"
                style={{ color: "#E6E6F0", minHeight: 100 }}
                maxLength={500}
              />
            </View>
            <Typography
              variant="caption"
              color="muted"
              className="text-right mt-2"
            >
              {newPostContent.length}/500
            </Typography>

            {/* Add Media */}
            <View className="mt-4">
              <Pressable
                onPress={() =>
                  Alert.alert("Add Media", "Photo library would open here")
                }
                className="flex-row items-center gap-2"
              >
                <View className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center">
                  <ImageIcon size={20} color="#7C3AED" />
                </View>
                <Typography variant="label" color="primary">
                  Add Photo/Video
                </Typography>
              </Pressable>
            </View>
          </View>

          {/* AI Bio Suggestion */}
          <View className="px-4 py-4 border-t border-surface-elevated">
            <Pressable className="flex-row items-center bg-ai/10 rounded-xl p-4 border border-ai/30">
              <Sparkles size={20} color="#FFD166" />
              <View className="flex-1 ml-3">
                <Typography variant="label" color="ai">
                  AI Writing Assistant
                </Typography>
                <Typography variant="caption" color="muted">
                  Get help crafting the perfect post
                </Typography>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Poke Modal */}
      <Modal
        visible={showPokeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPokeModal(false)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <Card variant="elevated" padding="lg" className="w-full max-w-sm">
            {/* Header */}
            <View className="items-center mb-6">
              <Avatar
                fallback={selectedUser?.name || "?"}
                locked={!selectedUser?.isRevealed}
                size="xl"
                className="mb-4"
              />
              <Typography variant="h2" className="text-center">
                {selectedUser?.name}
              </Typography>
              {!selectedUser?.isRevealed && (
                <Badge
                  label="Profile Hidden"
                  variant="default"
                  className="mt-2"
                />
              )}
            </View>

            {/* Info */}
            <View className="bg-surface rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-2">
                <Hand size={18} color="#7C3AED" />
                <Typography variant="label" className="ml-2">
                  Send a Poke
                </Typography>
              </View>
              <Typography variant="caption" color="muted">
                When you poke someone, they&apos;ll see your bio and interests.
                They can then decide whether to start a conversation with you.
              </Typography>
            </View>

            {/* Actions */}
            <View className="gap-3">
              <Button
                variant="primary"
                size="lg"
                onPress={handlePoke}
                className="w-full"
                icon={<Hand size={18} color="#FFFFFF" />}
              >
                Send Poke
              </Button>
              <Button
                variant="ghost"
                size="md"
                onPress={() => setShowPokeModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-elevated">
            <Pressable onPress={() => setShowCommentsModal(false)}>
              <X size={24} color="#E6E6F0" />
            </Pressable>
            <Typography variant="h3">Comments</Typography>
            <View className="w-6" />
          </View>

          <FlatList
            data={posts.find((p) => p.id === activePostId)?.commentsList || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-4 py-3 border-b border-surface-elevated/50">
                <View className="flex-row items-start">
                  <Avatar
                    fallback={item.user.name}
                    size="sm"
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Typography variant="label" className="font-bold">
                        {item.user.name}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {item.timestamp}
                      </Typography>
                    </View>
                    <Typography variant="body" className="mt-1">
                      {item.text}
                    </Typography>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Typography variant="body" color="muted">
                  No comments yet. Be the first!
                </Typography>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          >
            <View className="px-4 py-3 border-t border-surface-elevated bg-surface flex-row items-center gap-3">
              <Avatar fallback="Y" size="sm" />
              <View className="flex-1 bg-surface-elevated rounded-full px-4 py-2 flex-row items-center">
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="#A6A6B2"
                  className="flex-1 text-body text-base py-1"
                  style={{ color: "#E6E6F0" }}
                  multiline
                />
              </View>
              <Pressable
                onPress={handleAddComment}
                disabled={!commentText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  commentText.trim() ? "bg-primary" : "bg-surface-elevated"
                }`}
              >
                <Send
                  size={18}
                  color={commentText.trim() ? "#FFFFFF" : "#A6A6B2"}
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
