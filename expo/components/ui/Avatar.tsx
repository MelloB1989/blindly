import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { Typography } from './Typography';
import { Lock, User } from 'lucide-react-native';

export interface AvatarProps {
  /**
   * Image source (remote URL or local asset).
   */
  source?: ImageSourcePropType | string;

  /**
   * Initials to display if no image is provided or if it fails to load.
   */
  fallback?: string;

  /**
   * Size of the avatar.
   * - sm: 32px
   * - md: 48px (default)
   * - lg: 64px
   * - xl: 96px
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Whether the avatar is locked (hidden).
   * If true, displays a lock icon instead of the image.
   */
  locked?: boolean;

  className?: string;
}

export function Avatar({
  source,
  fallback,
  size = 'md',
  locked = false,
  className = '',
}: AvatarProps) {

  // Size styles
  let sizeStyles = "";
  let iconSize = 20;
  let textSize: 'caption' | 'label' | 'body' | 'h3' = 'label';

  switch (size) {
    case 'sm':
      sizeStyles = "w-8 h-8";
      iconSize = 14;
      textSize = 'caption';
      break;
    case 'md':
      sizeStyles = "w-12 h-12";
      iconSize = 20;
      textSize = 'label';
      break;
    case 'lg':
      sizeStyles = "w-16 h-16";
      iconSize = 24;
      textSize = 'body';
      break;
    case 'xl':
      sizeStyles = "w-24 h-24";
      iconSize = 32;
      textSize = 'h3';
      break;
  }

  // Container styles
  const containerStyles = `rounded-full overflow-hidden items-center justify-center bg-surface-elevated border border-white/5 ${sizeStyles} ${className}`;

  // Render Locked State
  if (locked) {
    return (
      <View className={containerStyles}>
        <Lock size={iconSize} color="#A6A6B2" />
      </View>
    );
  }

  // Render Image
  if (source) {
    const imageSource = typeof source === 'string' ? { uri: source } : source;
    return (
      <View className={containerStyles}>
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="cover"
          accessibilityLabel={fallback || "User avatar"}
        />
      </View>
    );
  }

  // Render Fallback (Initials or User Icon)
  return (
    <View className={containerStyles}>
      {fallback ? (
        <Typography variant={textSize} color="muted" className="font-semibold">
          {fallback.substring(0, 2).toUpperCase()}
        </Typography>
      ) : (
        <User size={iconSize} color="#A6A6B2" />
      )}
    </View>
  );
}
