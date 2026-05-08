import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Fonts } from '../lib/theme';

interface Props {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, rightComponent, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.right}>{rightComponent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  left: { flex: 1 },
  right: { marginLeft: Spacing.md },
  title: {
    fontSize: 28,
    ...Fonts.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mist,
    marginTop: 4,
  },
});
