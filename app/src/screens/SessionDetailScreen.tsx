import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS, HARDWARE_GUIDE } from '../constants';
import { RootStackParamList } from '../navigation';
import { useSessionStore } from '../store/useSessionStore';
import { getSessionById } from '../services/database';
import { DiagnosticSession } from '../types';
import ScreenHeader from '../components/ScreenHeader';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SessionDetail'>;

function severityColor(s: 'low' | 'medium' | 'high') {
  return s === 'high' ? COLORS.danger : s === 'medium' ? COLORS.warning : COLORS.success;
}

export default function SessionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;
  const { sessions } = useSessionStore();
  const [fullSession, setFullSession] = useState<DiagnosticSession | null>(null);

  // Try store first, then DB for full touch point data
  const storeSession = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    getSessionById(sessionId).then((s) => {
      if (s) setFullSession(s);
    });
  }, [sessionId]);

  const session = fullSession ?? storeSession;
  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScreenHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Session not found.</Text>
        </View>
      </View>
    );
  }

  const touchCount = session.touchPoints.length;
  const ghostCount = session.touchPoints.filter((p) => p.isGhost).length;
  const faultyAreas = session.faultyAreas ?? [];
  const duration =
    session.endedAt && session.startedAt
      ? Math.round((session.endedAt - session.startedAt) / 1000)
      : null;

  const uniqueZones = Array.from(
    new Set(faultyAreas.map((a) => a.hardwareZone).filter(Boolean)),
  );
  const guideItems = HARDWARE_GUIDE.filter((g) => uniqueZones.includes(g.zone));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        rightAction={
          touchCount > 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Heatmap', { sessionId: session.id })}
            >
              <Ionicons name="flame-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta info */}
        <View style={styles.metaCard}>
          <Row label="Type" value={session.type.replace('_', ' ')} />
          <Row
            label="Status"
            value={session.status}
            valueColor={
              session.status === 'completed' ? COLORS.success : COLORS.warning
            }
          />
          <Row
            label="Started"
            value={format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}
          />
          {duration !== null && <Row label="Duration" value={`${duration}s`} />}
          {session.deviceModel && <Row label="Device" value={session.deviceModel} />}
          {session.notes && <Row label="Notes" value={session.notes} />}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Results</Text>
        <View style={styles.statsRow}>
          <StatBox label="Touches" value={touchCount.toString()} />
          <StatBox label="Ghost" value={ghostCount.toString()} accent={COLORS.ghost} />
          <StatBox label="Faulty Areas" value={faultyAreas.length.toString()} accent={COLORS.danger} />
        </View>

        {/* Hardware recommendations */}
        {guideItems.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Hardware Recommendations</Text>
            {guideItems.map((item) => (
              <View key={item.zone} style={styles.guideCard}>
                <View style={[styles.severityPill, { backgroundColor: severityColor(item.severity) }]}>
                  <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
                </View>
                <Text style={styles.guideLabel}>{item.label}</Text>
                <Text style={styles.guideDesc}>{item.description}</Text>
              </View>
            ))}
          </>
        )}

        {/* View heatmap CTA */}
        {touchCount > 0 && (
          <TouchableOpacity
            style={styles.heatmapBtn}
            onPress={() => navigation.navigate('Heatmap', { sessionId: session.id })}
          >
            <Ionicons name="flame-outline" size={18} color={COLORS.primary} />
            <Text style={styles.heatmapBtnText}>View Touch Heatmap</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textMuted },

  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.textMuted, fontSize: 13 },
  rowValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },

  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },

  guideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  severityPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  severityText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  guideLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  guideDesc: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },

  heatmapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  heatmapBtnText: { flex: 1, color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
