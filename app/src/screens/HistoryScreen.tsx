import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { COLORS } from '../constants';
import { RootStackParamList } from '../navigation';
import { useSessionStore } from '../store/useSessionStore';
import { DiagnosticSession } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function sessionIcon(type: DiagnosticSession['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'grid': return 'grid-outline';
    case 'ghost_monitor': return 'eye-outline';
    case 'multi_touch': return 'finger-print-outline';
    default: return 'analytics-outline';
  }
}

function sessionLabel(type: DiagnosticSession['type']): string {
  switch (type) {
    case 'grid': return 'Touch Grid Test';
    case 'ghost_monitor': return 'Ghost Monitor';
    case 'multi_touch': return 'Multi-Touch Test';
    default: return 'Diagnostic';
  }
}

function statusColor(s: DiagnosticSession['status']) {
  return s === 'completed' ? COLORS.success : s === 'cancelled' ? COLORS.danger : COLORS.warning;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { sessions, loadSessions, deleteSession } = useSessionStore();

  useEffect(() => {
    loadSessions();
  }, []);

  function confirmDelete(id: string) {
    Alert.alert('Delete Session', 'Remove this diagnostic session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSession(id),
      },
    ]);
  }

  function renderItem({ item }: { item: DiagnosticSession }) {
    const duration =
      item.endedAt && item.startedAt
        ? Math.round((item.endedAt - item.startedAt) / 1000)
        : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
        activeOpacity={0.8}
        onLongPress={() => confirmDelete(item.id)}
      >
        <View style={styles.cardIcon}>
          <Ionicons name={sessionIcon(item.type)} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{sessionLabel(item.type)}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          </View>
          <Text style={styles.cardDate}>
            {format(new Date(item.startedAt), 'MMM d, yyyy · h:mm a')}
          </Text>
          {item.notes && (
            <Text style={styles.cardNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
          {duration !== null && (
            <Text style={styles.cardDuration}>{duration}s</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textDim} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session History</Text>
        <Text style={styles.headerSub}>Long-press a session to delete it</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={COLORS.textDim} />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyDesc}>
            Run a diagnostic from the Home tab to see results here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },

  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardDate: { color: COLORS.textMuted, fontSize: 12 },
  cardNotes: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
  cardDuration: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: { color: COLORS.textMuted, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: COLORS.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
