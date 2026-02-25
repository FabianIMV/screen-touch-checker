import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../navigation';
import { COLORS } from '../constants';
import { useSessionStore } from '../store/useSessionStore';
import { initDatabase } from '../services/database';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DiagnosticCard {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof RootStackParamList;
  gradient: [string, string];
  badge?: string;
}

const CARDS: DiagnosticCard[] = [
  {
    title: 'Touch Grid Test',
    description: 'Tap each zone on the screen to identify unresponsive or faulty areas.',
    icon: 'grid-outline',
    route: 'GridTest',
    gradient: ['#4F46E5', '#6366F1'],
    badge: 'Recommended',
  },
  {
    title: 'Ghost Touch Monitor',
    description: 'Record phantom touches automatically over 30 seconds without touching the screen.',
    icon: 'eye-outline',
    route: 'GhostMonitor',
    gradient: ['#BE185D', '#EC4899'],
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { sessions, loadSessions } = useSessionStore();

  useEffect(() => {
    initDatabase().then(loadSessions);
  }, []);

  const lastSession = sessions[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="phone-portrait" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.heroTitle}>Touch Diagnostics</Text>
        <Text style={styles.heroSub}>
          Identify ghost touch zones and pinpoint hardware repair areas on your iPhone.
        </Text>
      </View>

      {/* Last session banner */}
      {lastSession && (
        <TouchableOpacity
          style={styles.lastSessionBanner}
          onPress={() =>
            navigation.navigate('SessionDetail', { sessionId: lastSession.id })
          }
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={16} color={COLORS.primaryLight} />
          <Text style={styles.lastSessionText}>
            Last session:{' '}
            <Text style={styles.lastSessionBold}>{lastSession.type.replace('_', ' ')}</Text>
          </Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Diagnostic Cards */}
      <Text style={styles.sectionTitle}>Run a Diagnostic</Text>
      {CARDS.map((card) => (
        <TouchableOpacity
          key={card.route}
          onPress={() => navigation.navigate(card.route as any)}
          activeOpacity={0.85}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {card.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{card.badge}</Text>
              </View>
            )}
            <View style={styles.cardIcon}>
              <Ionicons name={card.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.description}</Text>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>Start test</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}

      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <StatBox
          label="Sessions"
          value={sessions.length.toString()}
          icon="analytics-outline"
        />
        <StatBox
          label="Ghost Detected"
          value={sessions
            .filter((s) => s.type === 'ghost_monitor')
            .length.toString()}
          icon="warning-outline"
        />
      </View>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  heroSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },

  lastSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lastSessionText: { flex: 1, color: COLORS.textMuted, fontSize: 13 },
  lastSessionBold: { color: COLORS.text, fontWeight: '600' },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  cardWrapper: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  card: { padding: 20, borderRadius: 20, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardIcon: { marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  cardDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  cardArrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardArrowText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },
});
