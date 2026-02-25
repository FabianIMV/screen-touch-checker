/**
 * Grid Test Screen
 *
 * Divides the screen into a GRID_ROWS × GRID_COLS matrix.
 * Each cell must be tapped by the user to be marked as OK.
 * If a tap registers on a cell that was never touched by the user
 * (i.e., the user is not near it) it counts as a potential ghost touch.
 *
 * Color coding:
 *   Grey   → untested
 *   Green  → OK (user tapped it)
 *   Red    → Faulty (registered but user did not intend it)
 *   Pink   → Ghost detected
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, GRID_ROWS, GRID_COLS, HARDWARE_GUIDE } from '../constants';
import { useSessionStore } from '../store/useSessionStore';
import { CellStatus, FaultyArea, HardwareZone } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function zoneForCell(row: number, col: number, totalRows: number, totalCols: number): HardwareZone {
  const isTop = row < 2;
  const isBottom = row >= totalRows - 2;
  const isLeft = col === 0;
  const isRight = col === totalCols - 1;

  if (isTop) return 'digitizer_top';
  if (isBottom) return 'digitizer_bottom';
  if (isLeft) return 'digitizer_left_edge';
  if (isRight) return 'digitizer_right_edge';
  return 'lcd_connector';
}

export default function GridTestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { startSession, endSession, cancelSession, activeSession, markCellStatus, addFaultyArea } =
    useSessionStore();

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Start session on mount
  useEffect(() => {
    startSession('grid');
    setStarted(true);
    return () => {
      cancelSession();
    };
  }, []);

  const gridCells = activeSession?.gridCells ?? [];

  const HEADER_H = insets.top + 60;
  const FOOTER_H = insets.bottom + 80;
  const GRID_H = SCREEN_H - HEADER_H - FOOTER_H;
  const CELL_W = SCREEN_W / GRID_COLS;
  const CELL_H = GRID_H / GRID_ROWS;

  function flashCell() {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (!started || finished) return;

      const cell = gridCells.find((c) => c.row === row && c.col === col);
      if (!cell) return;

      if (cell.status === 'ok') {
        // Already marked — toggle to faulty if double-tapped
        markCellStatus(row, col, 'faulty');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        markCellStatus(row, col, 'ok');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        flashCell();
      }
    },
    [started, finished, gridCells],
  );

  function getCellColor(status: CellStatus): string {
    switch (status) {
      case 'ok':
        return COLORS.cellOk;
      case 'faulty':
        return COLORS.cellFaulty;
      case 'ghost':
        return COLORS.cellGhost;
      default:
        return COLORS.cellUntested;
    }
  }

  async function handleFinish() {
    if (finished) return;
    setFinished(true);

    // Detect faulty areas and attach hardware zones
    const faultyCells = gridCells.filter((c) => c.status === 'faulty' || c.status === 'ghost');
    for (const cell of faultyCells) {
      const area: Omit<FaultyArea, 'id'> = {
        label: `Cell (${cell.row},${cell.col})`,
        xPercent: (cell.col / GRID_COLS) * 100,
        yPercent: (cell.row / GRID_ROWS) * 100,
        widthPercent: (1 / GRID_COLS) * 100,
        heightPercent: (1 / GRID_ROWS) * 100,
        severity: 'medium',
        hardwareZone: zoneForCell(cell.row, cell.col, GRID_ROWS, GRID_COLS),
      };
      addFaultyArea(area);
    }

    const untestedCount = gridCells.filter((c) => c.status === 'untested').length;
    const faultyCount = faultyCells.length;

    await endSession(
      `Grid test: ${GRID_ROWS * GRID_COLS - untestedCount} cells tested, ${faultyCount} faulty.`,
    );

    Alert.alert(
      'Test Complete',
      faultyCount > 0
        ? `${faultyCount} faulty zone(s) detected. Check the Repair Guide for next steps.`
        : 'All tested zones responded correctly.',
      [{ text: 'Done', onPress: () => navigation.goBack() }],
    );
  }

  function handleCancel() {
    Alert.alert('Cancel Test', 'Discard this session?', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelSession();
          navigation.goBack();
        },
      },
    ]);
  }

  const testedCount = gridCells.filter((c) => c.status !== 'untested').length;
  const totalCells = GRID_ROWS * GRID_COLS;
  const progress = totalCells > 0 ? testedCount / totalCells : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} hitSlop={8}>
          <Ionicons name="close" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Touch Grid Test</Text>
          <Text style={styles.headerSub}>
            {testedCount}/{totalCells} cells tested
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleFinish}
          style={[styles.doneBtn, testedCount === 0 && styles.doneBtnDisabled]}
          disabled={testedCount === 0}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Tap every cell to test it. Double-tap a green cell to mark it as faulty.
      </Text>

      {/* Grid */}
      <View style={[styles.grid, { height: GRID_H }]}>
        {Array.from({ length: GRID_ROWS }, (_, row) => (
          <View key={row} style={[styles.row, { height: CELL_H }]}>
            {Array.from({ length: GRID_COLS }, (_, col) => {
              const cell = gridCells.find((c) => c.row === row && c.col === col);
              const status = cell?.status ?? 'untested';
              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.cell,
                    { width: CELL_W, height: CELL_H, backgroundColor: getCellColor(status) },
                  ]}
                  onPress={() => handleCellPress(row, col)}
                  activeOpacity={0.7}
                >
                  {status === 'ok' && (
                    <Ionicons name="checkmark" size={Math.min(CELL_W, CELL_H) * 0.45} color="#22C55E" />
                  )}
                  {status === 'faulty' && (
                    <Ionicons name="close" size={Math.min(CELL_W, CELL_H) * 0.45} color="#EF4444" />
                  )}
                  {status === 'ghost' && (
                    <Ionicons name="warning" size={Math.min(CELL_W, CELL_H) * 0.45} color={COLORS.ghost} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { paddingBottom: insets.bottom + 12 }]}>
        <LegendItem color={COLORS.cellUntested} label="Untested" />
        <LegendItem color={COLORS.cellOk} label="OK" />
        <LegendItem color={COLORS.cellFaulty} label="Faulty" />
        <LegendItem color={COLORS.cellGhost} label="Ghost" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  headerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.primary,
  },
  instructions: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  grid: { flexDirection: 'column' },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 0.5,
    borderColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: COLORS.textMuted, fontSize: 11 },
});
