/**
 * Heatmap Screen
 *
 * Renders a visual heatmap of all touch points from a given session.
 * Each touch is drawn as a radial gradient circle; overlapping points
 * create warmer colors (yellow → red) to indicate problem density.
 *
 * Uses React Native's Canvas-compatible approach via SVG-like manual
 * rendering with View components and opacity blending.
 */
import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, HARDWARE_GUIDE } from '../constants';
import { RootStackParamList } from '../navigation';
import { useSessionStore } from '../store/useSessionStore';
import { HardwareZone, TouchPoint } from '../types';
import ScreenHeader from '../components/ScreenHeader';

type Route = RouteProp<RootStackParamList, 'Heatmap'>;

const { width: W, height: H } = Dimensions.get('window');
const HEATMAP_H = W * 1.8; // portrait phone aspect ratio

const RADIUS = 28;

function heatColor(intensity: number): string {
  // intensity: 0 (cool) → 1 (hot)
  const r = Math.round(Math.min(255, intensity * 510));
  const g = Math.round(Math.max(0, 255 - Math.abs(intensity * 510 - 255)));
  const b = Math.round(Math.max(0, 255 - intensity * 510));
  return `rgb(${r},${g},${b})`;
}

interface HeatCell {
  x: number;
  y: number;
  count: number;
  normalizedIntensity: number;
}

function buildHeatCells(points: TouchPoint[], containerW: number, containerH: number): HeatCell[] {
  if (points.length === 0) return [];

  const cellSize = 20;
  const cols = Math.ceil(containerW / cellSize);
  const rows = Math.ceil(containerH / cellSize);
  const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (const pt of points) {
    const col = Math.floor((pt.x / containerW) * cols);
    const row = Math.floor((pt.y / containerH) * rows);
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      grid[row][col] += 1;
    }
  }

  const maxCount = Math.max(1, ...grid.flat());
  const cells: HeatCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) {
        cells.push({
          x: c * cellSize,
          y: r * cellSize,
          count: grid[r][c],
          normalizedIntensity: grid[r][c] / maxCount,
        });
      }
    }
  }
  return cells;
}

export default function HeatmapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { sessionId } = route.params;
  const { sessions } = useSessionStore();

  const session = sessions.find((s) => s.id === sessionId);
  const points = session?.touchPoints ?? [];

  const heatCells = useMemo(() => buildHeatCells(points, W, HEATMAP_H), [points]);

  const faultyAreas = session?.faultyAreas ?? [];
  const uniqueZones: HardwareZone[] = Array.from(
    new Set(faultyAreas.map((a) => a.hardwareZone).filter(Boolean) as HardwareZone[]),
  );
  const guideItems = HARDWARE_GUIDE.filter((g) => uniqueZones.includes(g.zone));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Touch Heatmap"
        subtitle={`${points.length} touch points`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Heatmap Canvas */}
        <View style={[styles.heatmapContainer, { height: HEATMAP_H }]}>
          {/* Phone outline */}
          <View style={styles.phoneOutline} />

          {/* Heat cells */}
          {heatCells.map((cell, i) => (
            <View
              key={i}
              style={[
                styles.heatCell,
                {
                  left: cell.x,
                  top: cell.y,
                  backgroundColor: heatColor(cell.normalizedIntensity),
                  opacity: 0.3 + cell.normalizedIntensity * 0.6,
                },
              ]}
            />
          ))}

          {/* Exact touch markers */}
          {points.map((pt, i) => (
            <View
              key={pt.id}
              style={[
                styles.touchMarker,
                {
                  left: pt.x - 4,
                  top: pt.y - 4,
                  backgroundColor: pt.isGhost ? COLORS.ghost : COLORS.primary,
                },
              ]}
            />
          ))}

          {points.length === 0 && (
            <View style={styles.emptyHeatmap}>
              <Ionicons name="analytics-outline" size={40} color={COLORS.textDim} />
              <Text style={styles.emptyHeatmapText}>No touch data recorded</Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <View key={v} style={[styles.legendBlock, { backgroundColor: heatColor(v) }]} />
          ))}
          <Text style={styles.legendLow}>Low</Text>
          <Text style={styles.legendHigh}>High</Text>
        </View>

        {/* Hardware zones */}
        {guideItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suspected Hardware Areas</Text>
            {guideItems.map((item) => (
              <View key={item.zone} style={styles.guideCard}>
                <View style={[styles.severityDot, { backgroundColor: severityColor(item.severity) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guideLabel}>{item.label}</Text>
                  <Text style={styles.guideDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Summary stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Touches" value={points.length.toString()} />
            <StatCard
              label="Ghost Touches"
              value={points.filter((p) => p.isGhost).length.toString()}
              accent={COLORS.ghost}
            />
            <StatCard label="Faulty Areas" value={faultyAreas.length.toString()} accent={COLORS.danger} />
            <StatCard label="Zones Affected" value={uniqueZones.length.toString()} accent={COLORS.warning} />
          </View>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function severityColor(s: 'low' | 'medium' | 'high'): string {
  return s === 'high' ? COLORS.danger : s === 'medium' ? COLORS.warning : COLORS.success;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  heatmapContainer: {
    width: W,
    position: 'relative',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  phoneOutline: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  heatCell: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  touchMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyHeatmap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyHeatmapText: { color: COLORS.textDim, fontSize: 14 },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendBlock: { flex: 1, height: 8, borderRadius: 2 },
  legendLow: { color: COLORS.textMuted, fontSize: 10, marginLeft: 4 },
  legendHigh: { color: COLORS.textMuted, fontSize: 10 },

  section: { padding: 20 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  guideLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  guideDesc: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { color: COLORS.primary, fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
