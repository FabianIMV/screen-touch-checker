import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, rightAction }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightAction ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  left: { width: 40 },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 40, alignItems: 'flex-end' },
  backBtn: { padding: 4 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});
