import React from 'react';
import { Text, TextProps } from 'react-native';

export interface TypographyProps extends TextProps {
  /**
   * The typographic style to apply.
   * - h1: 28px, Bold
   * - h2: 24px, Semibold
   * - h3: 20px, Semibold
   * - body: 16px, Normal (default)
   * - label: 14px, Medium
   * - caption: 12px, Normal
   */
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption';

  /**
   * The color theme to apply.
   * - default: #E6E6F0 (Body text)
   * - muted: #A6A6B2
   * - primary: #7C3AED
   * - accent: #8B5CF6
   * - success: #16A34A
   * - danger: #EF4444
   * - ai: #FFD166
   */
  color?: 'default' | 'muted' | 'primary' | 'accent' | 'success' | 'danger' | 'ai';

  className?: string;
}

export function Typography({
  variant = 'body',
  color = 'default',
  className = '',
  style,
  children,
  ...props
}: TypographyProps) {

  let styles = "font-inter";

  // Variant styles
  switch (variant) {
    case 'h1':
      styles += " text-[28px] font-bold leading-tight";
      break;
    case 'h2':
      styles += " text-[24px] font-semibold leading-snug";
      break;
    case 'h3':
      styles += " text-[20px] font-semibold leading-snug";
      break;
    case 'body':
      styles += " text-[16px] font-normal leading-relaxed";
      break;
    case 'label':
      styles += " text-[14px] font-medium leading-none";
      break;
    case 'caption':
      styles += " text-[12px] font-normal leading-tight";
      break;
  }

  // Color styles
  switch (color) {
    case 'default':
      styles += " text-body";
      break;
    case 'muted':
      styles += " text-muted";
      break;
    case 'primary':
      styles += " text-primary";
      break;
    case 'accent':
      styles += " text-accent";
      break;
    case 'success':
      styles += " text-success";
      break;
    case 'danger':
      styles += " text-danger";
      break;
    case 'ai':
      styles += " text-ai";
      break;
  }

  return (
    <Text
      className={`${styles} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}
