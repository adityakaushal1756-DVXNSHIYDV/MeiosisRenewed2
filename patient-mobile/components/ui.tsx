import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Fonts } from '../lib/theme';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({ label, value, sub, accentColor = Colors.neon, onPress, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </TouchableOpacity>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  neonBorder?: boolean;
}

export function GlassCard({ children, style, onPress, neonBorder }: GlassCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.glassCard, neonBorder && styles.neonBorder, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.glassCard, neonBorder && styles.neonBorder, style]}>
      {children}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface NeonBadgeProps {
  label: string;
  color?: string;
  dotPulse?: boolean;
}

export function NeonBadge({ label, color = Colors.neon, dotPulse = false }: NeonBadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color + '40', backgroundColor: color + '15' }]}>
      {dotPulse && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function ActionButton({ label, onPress, variant = 'primary', icon, fullWidth, disabled }: ActionButtonProps) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[styles.btnWrapper, fullWidth && styles.fullWidth]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <LinearGradient
          colors={disabled ? ['#2A8A5A', '#1D6B45'] : [Colors.neon, '#00C97A']}
          style={styles.primaryBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {icon}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (variant === 'danger') {
    return (
      <TouchableOpacity
        style={[styles.ghostBtn, styles.dangerBtn, fullWidth && styles.fullWidth]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled}
      >
        {icon}
        <Text style={[styles.ghostBtnText, { color: Colors.rose }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.ghostBtn, fullWidth && styles.fullWidth]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {icon}
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  label: {
    fontSize: 11,
    color: Colors.mist,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  sub: {
    fontSize: 11,
    color: Colors.mist,
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  neonBorder: {
    borderColor: 'rgba(82, 255, 157, 0.2)',
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.mist,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.xl,
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.glass,
  },
  dangerBtn: {
    borderColor: 'rgba(255, 77, 109, 0.3)',
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  fullWidth: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.mist,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyAction: {
    marginTop: Spacing.xl,
  },
});
