/**
 * Hardware Repair Guide Screen
 *
 * Interactive reference for iPhone technicians.
 * Shows each hardware zone, its connection to ghost touch symptoms,
 * and step-by-step repair actions.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, HARDWARE_GUIDE } from '../constants';
import { HardwareGuideItem } from '../types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { width: W } = Dimensions.get('window');

// Simplified iPhone diagram zones (percentages of container)
const DIAGRAM_ZONES: { zone: HardwareGuideItem['zone']; x: number; y: number; w: number; h: number; label: string }[] = [
  { zone: 'digitizer_top',    x: 10, y: 5,  w: 80, h: 12, label: 'Top' },
  { zone: 'front_camera_flex', x: 35, y: 6, w: 30, h: 6,  label: 'Cam' },
  { zone: 'digitizer_left_edge', x: 2, y: 18, w: 8, h: 65, label: 'L' },
  { zone: 'digitizer_right_edge', x: 90, y: 18, w: 8, h: 65, label: 'R' },
  { zone: 'lcd_connector',   x: 25, y: 40, w: 50, h: 20, label: 'LCD\nConnector' },
  { zone: 'battery_connector', x: 20, y: 62, w: 60, h: 10, label: 'Battery' },
  { zone: 'digitizer_bottom', x: 10, y: 80, w: 80, h: 12, label: 'Bottom' },
  { zone: 'home_button_flex', x: 35, y: 84, w: 30, h: 8, label: 'Home' },
];

function severityColor(s: 'low' | 'medium' | 'high') {
  return s === 'high' ? COLORS.danger : s === 'medium' ? COLORS.warning : COLORS.success;
}

export default function HardwareGuideScreen() {
  const insets = useSafeAreaInsets();
  const [selectedZone, setSelectedZone] = useState<HardwareGuideItem['zone'] | null>(null);
  const [expandedZone, setExpandedZone] = useState<HardwareGuideItem['zone'] | null>(null);

  const selectedGuide = HARDWARE_GUIDE.find((g) => g.zone === selectedZone);
  const DIAGRAM_H = W * 1.6;

  function toggleExpand(zone: HardwareGuideItem['zone']) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedZone((prev) => (prev === zone ? null : zone));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hardware Repair Guide</Text>
        <Text style={styles.headerSub}>Tap a zone on the diagram to learn what to inspect</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Interactive Diagram */}
        <View style={[styles.diagram, { height: DIAGRAM_H }]}>
          {/* Phone silhouette */}
          <View style={styles.phoneSilhouette} />

          {/* Zone hotspots */}
          {DIAGRAM_ZONES.map((dz) => {
            const guide = HARDWARE_GUIDE.find((g) => g.zone === dz.zone);
            const isSelected = selectedZone === dz.zone;
            return (
              <TouchableOpacity
                key={dz.zone}
                style={[
                  styles.zoneHotspot,
                  {
                    left: `${dz.x}%`,
                    top: `${dz.y}%`,
                    width: `${dz.w}%`,
                    height: `${dz.h}%`,
                    borderColor: isSelected
                      ? '#fff'
                      : severityColor(guide?.severity ?? 'low'),
                    backgroundColor: isSelected
                      ? `${severityColor(guide?.severity ?? 'low')}55`
                      : `${severityColor(guide?.severity ?? 'low')}22`,
                  },
                ]}
                onPress={() => setSelectedZone(dz.zone === selectedZone ? null : dz.zone)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.zoneLabel,
                    isSelected && styles.zoneLabelSelected,
                  ]}
                >
                  {dz.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected zone details */}
        {selectedGuide && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={[styles.severityPill, { backgroundColor: severityColor(selectedGuide.severity) }]}>
                <Text style={styles.severityText}>{selectedGuide.severity.toUpperCase()}</Text>
              </View>
              <Text style={styles.selectedTitle}>{selectedGuide.label}</Text>
            </View>
            <Text style={styles.selectedDesc}>{selectedGuide.description}</Text>
            <Text style={styles.stepsTitle}>Repair Steps</Text>
            {selectedGuide.repairSteps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Full guide list */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>All Hardware Zones</Text>
          {HARDWARE_GUIDE.map((item) => (
            <TouchableOpacity
              key={item.zone}
              style={styles.guideRow}
              onPress={() => toggleExpand(item.zone)}
              activeOpacity={0.8}
            >
              <View style={styles.guideRowTop}>
                <View style={[styles.severityDot, { backgroundColor: severityColor(item.severity) }]} />
                <Text style={styles.guideRowTitle}>{item.label}</Text>
                <Ionicons
                  name={expandedZone === item.zone ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </View>
              {expandedZone === item.zone && (
                <View style={styles.guideExpanded}>
                  <Text style={styles.guideExpandedDesc}>{item.description}</Text>
                  {item.repairSteps.map((step, i) => (
                    <View key={i} style={styles.miniStep}>
                      <Text style={styles.miniStepNum}>{i + 1}.</Text>
                      <Text style={styles.miniStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
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

  diagram: {
    width: W,
    position: 'relative',
    backgroundColor: COLORS.surface,
  },
  phoneSilhouette: {
    position: 'absolute',
    top: '2%',
    left: '8%',
    right: '8%',
    bottom: '2%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  zoneHotspot: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  zoneLabelSelected: { color: COLORS.text },

  selectedCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  severityPill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  selectedTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', flex: 1 },
  selectedDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  stepsTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText: { color: COLORS.text, fontSize: 13, lineHeight: 20, flex: 1 },

  listSection: { padding: 20 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  guideRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guideRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  guideRowTitle: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
  guideExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  guideExpandedDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  miniStep: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  miniStepNum: { color: COLORS.primary, fontSize: 13, fontWeight: '700', width: 16 },
  miniStepText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, flex: 1 },
});
