/**
 * Ghost Touch Monitor Screen
 *
 * User places the phone face-up on a stable surface WITHOUT touching the screen.
 * Any touch event that fires is recorded as a potential ghost touch.
 * A countdown timer runs for GHOST_MONITOR_DURATION_MS.
 * At the end, a summary with detected ghost positions is shown.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS, GHOST_MONITOR_DURATION_MS } from '../constants';
import { useSessionStore } from '../store/useSessionStore';
import { TouchPoint } from '../types';

const { width: W, height: H } = Dimensions.get('window');

interface GhostDot {
  id: string;
  x: number;
  y: number;
  ts: number;
}

export default function GhostMonitorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { startSession, endSession, cancelSession, recordTouch } = useSessionStore();

  const [phase, setPhase] = useState<'idle' | 'monitoring' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState(GHOST_MONITOR_DURATION_MS / 1000);
  const [ghostDots, setGhostDots] = useState<GhostDot[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseScale.value > 1 ? 0.6 : 1,
  }));

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cancelAnimation(pulseScale);
    };
  }, []);

  function startMonitoring() {
    startSession('ghost_monitor');
    setPhase('monitoring');
    setTimeLeft(GHOST_MONITOR_DURATION_MS / 1000);
    setGhostDots([]);

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function handleFinish() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimation(pulseScale);
    pulseScale.value = withTiming(1, { duration: 300 });

    setPhase('finished');

    const count = ghostDots.length;
    await endSession(
      `Ghost monitor: ${count} phantom touch${count !== 1 ? 'es' : ''} detected.`,
    );
  }

  function handleCancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelAnimation(pulseScale);
    cancelSession();
    navigation.goBack();
  }

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (phase !== 'monitoring') return;

      const { locationX, locationY } = e.nativeEvent;
      const ts = Date.now();
      const id = `${ts}-${Math.random().toString(36).slice(2, 7)}`;

      const dot: GhostDot = { id, x: locationX, y: locationY, ts };
      setGhostDots((prev) => [...prev, dot]);

      recordTouch({ x: locationX, y: locationY, timestamp: ts, isGhost: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [phase],
  );

  const pct = ((GHOST_MONITOR_DURATION_MS / 1000 - timeLeft) / (GHOST_MONITOR_DURATION_MS / 1000)) * 100;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} hitSlop={8}>
          <Ionicons name="close" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghost Touch Monitor</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Main touch capture area */}
      <View
        style={styles.captureArea}
        onStartShouldSetResponder={() => phase === 'monitoring'}
        onResponderGrant={handleTouchStart}
      >
        {phase === 'idle' && (
          <View style={styles.centerContent}>
            <View style={styles.iconWrap}>
              <Ionicons name="eye-outline" size={48} color={COLORS.ghost} />
            </View>
            <Text style={styles.phaseTitle}>Ready to Monitor</Text>
            <Text style={styles.phaseDesc}>
              Place your phone on a flat surface and{' '}
              <Text style={styles.accent}>do not touch the screen</Text> during the test.
              Any touch registered will be flagged as a ghost touch.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startMonitoring}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Start 30-second Monitor</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'monitoring' && (
          <View style={styles.centerContent} pointerEvents="none">
            <Animated.View style={[styles.timerRing, pulseStyle]}>
              <Text style={styles.timerNumber}>{timeLeft}</Text>
              <Text style={styles.timerLabel}>seconds left</Text>
            </Animated.View>

            <Text style={styles.ghostCount}>
              {ghostDots.length === 0
                ? 'No ghost touches yet'
                : `${ghostDots.length} ghost touch${ghostDots.length !== 1 ? 'es' : ''} detected!`}
            </Text>

            <Text style={styles.monitoringHint}>
              Do NOT touch the screen
            </Text>

            {/* Progress bar */}
            <View style={styles.progressWrap}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
          </View>
        )}

        {phase === 'finished' && (
          <View style={styles.centerContent}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={ghostDots.length > 0 ? 'warning-outline' : 'checkmark-circle-outline'}
                size={48}
                color={ghostDots.length > 0 ? COLORS.warning : COLORS.success}
              />
            </View>
            <Text style={styles.phaseTitle}>Monitor Complete</Text>
            {ghostDots.length === 0 ? (
              <Text style={styles.phaseDesc}>
                No ghost touches detected. Your digitizer appears to be functioning correctly.
              </Text>
            ) : (
              <Text style={styles.phaseDesc}>
                <Text style={styles.accent}>{ghostDots.length} ghost touch{ghostDots.length !== 1 ? 'es' : ''}</Text> detected.
                Check the Heatmap for affected areas and the Repair Guide for next steps.
              </Text>
            )}
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.startBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ghost dot markers */}
        {ghostDots.map((dot) => (
          <GhostDotMarker key={dot.id} x={dot.x} y={dot.y} />
        ))}
      </View>
    </View>
  );
}

function GhostDotMarker({ x, y }: { x: number; y: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.4, { duration: 200 }),
      withTiming(1, { duration: 150 }),
    );
    opacity.value = withTiming(0.7, { duration: 500, easing: Easing.out(Easing.quad) });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ghostDot,
        style,
        { left: x - 16, top: y - 16 },
      ]}
    >
      <Ionicons name="close-circle" size={32} color={COLORS.ghost} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  captureArea: { flex: 1, position: 'relative' },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  phaseTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  phaseDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  accent: { color: COLORS.ghost, fontWeight: '700' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ghost,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  timerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.ghost,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timerNumber: { color: COLORS.text, fontSize: 42, fontWeight: '800' },
  timerLabel: { color: COLORS.textMuted, fontSize: 12 },
  ghostCount: { color: COLORS.ghost, fontSize: 16, fontWeight: '700' },
  monitoringHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressWrap: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: 4, backgroundColor: COLORS.ghost, borderRadius: 2 },

  ghostDot: { position: 'absolute', width: 32, height: 32 },
});
