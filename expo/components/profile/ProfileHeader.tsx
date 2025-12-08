import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Typography } from "../ui/Typography";
import { CheckCircle2, Camera, Edit3 } from "lucide-react-native";

interface ProfileHeaderProps {
  user: {
    firstName: string;
    lastName?: string;
    age?: number;
    photos: string[];
    isVerified: boolean;
    email?: string;
  };
  isOwnProfile?: boolean;
  onEditPhoto?: () => void;
  onEditProfile?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile = false,
  onEditPhoto,
  onEditProfile,
}) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onEditPhoto}
        disabled={!isOwnProfile}
        style={styles.avatarContainer}
      >
        {/* Simple ring border - no gradient box */}
        <Avatar source={user.photos?.[0]} fallback={user.firstName} size="xl" />

        {isOwnProfile && (
          <View style={styles.cameraButton}>
            <Camera size={14} color="#FFFFFF" />
          </View>
        )}
      </Pressable>

      <View style={styles.nameRow}>
        <Typography variant="h2" className="text-white text-2xl font-bold">
          {user.firstName}
          {user.age ? `, ${user.age}` : ""}
        </Typography>
        {user.isVerified && (
          <CheckCircle2 size={22} color="#14D679" fill="#14D679" />
        )}
      </View>

      {user.email && isOwnProfile && (
        <Typography variant="caption" className="text-white/50 mb-2">
          {user.email}
        </Typography>
      )}

      {!isOwnProfile && user.isVerified && (
        <View style={styles.verifiedBadge}>
          <Typography variant="caption" className="text-[#14D679] font-medium">
            ✓ Verified
          </Typography>
        </View>
      )}

      {isOwnProfile && (
        <Pressable onPress={onEditProfile} style={styles.editButton}>
          <Edit3 size={14} color="#A78BFA" />
          <Typography className="text-white ml-2 font-medium">
            Edit Profile
          </Typography>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#7C3AED",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "#080314",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: "rgba(20, 214, 121, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 214, 121, 0.2)",
    marginTop: 4,
  },
  editButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
});
