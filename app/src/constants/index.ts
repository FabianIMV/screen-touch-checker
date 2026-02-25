import { HardwareGuideItem } from '../types';

export const GRID_ROWS = 10;
export const GRID_COLS = 6;

export const GHOST_TOUCH_THRESHOLD_MS = 200; // touches faster than this may be ghost
export const GHOST_MONITOR_DURATION_MS = 30_000; // 30 seconds

export const COLORS = {
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceElevated: '#1C1C28',
  primary: '#6366F1',       // indigo
  primaryLight: '#818CF8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  ghost: '#EC4899',
  text: '#F1F5F9',
  textMuted: '#64748B',
  textDim: '#334155',
  border: '#1E293B',
  cellUntested: '#1E293B',
  cellOk: '#166534',
  cellFaulty: '#7F1D1D',
  cellGhost: '#831843',
} as const;

export const HARDWARE_GUIDE: HardwareGuideItem[] = [
  {
    zone: 'lcd_connector',
    label: 'LCD / Digitizer Connector',
    description:
      'The ribbon cable connecting the display assembly to the logic board. A loose or dirty connector is the #1 cause of ghost touches.',
    repairSteps: [
      'Disconnect battery before touching connectors.',
      'Re-seat the digitizer connector firmly until you hear/feel a click.',
      'Inspect connector pins for bent contacts or debris.',
      'Clean with 99% isopropyl alcohol and a soft brush.',
    ],
    severity: 'high',
  },
  {
    zone: 'digitizer_top',
    label: 'Digitizer – Top Edge',
    description:
      'Ghost touches near the top edge often point to damage or contamination on the top section of the digitizer panel.',
    repairSteps: [
      'Inspect top edge of the digitizer for cracks or lifting.',
      'Check for moisture or residue under the glass.',
      'Replace digitizer if physical damage is visible.',
    ],
    severity: 'medium',
  },
  {
    zone: 'digitizer_bottom',
    label: 'Digitizer – Bottom Edge',
    description:
      'Issues at the bottom can relate to the home button flex or bottom digitizer ribbon.',
    repairSteps: [
      'Re-seat the home button flex cable.',
      'Inspect the lower digitizer ribbon for kinks.',
      'Check for debris near the charging port area.',
    ],
    severity: 'medium',
  },
  {
    zone: 'digitizer_left_edge',
    label: 'Digitizer – Left Edge',
    description:
      'Consistent ghost touches along the left side suggest edge damage or a warped frame pressing on the digitizer.',
    repairSteps: [
      'Inspect the phone frame for bending or warping.',
      'Check for cracks along the left edge of the glass.',
      'Ensure no screws are over-tightened distorting the frame.',
    ],
    severity: 'medium',
  },
  {
    zone: 'digitizer_right_edge',
    label: 'Digitizer – Right Edge',
    description:
      'Similar to left-edge issues; also check the power button flex which runs along this side.',
    repairSteps: [
      'Re-seat the power/volume button flex cable.',
      'Inspect right edge of frame for physical damage.',
      'Verify no foreign objects between frame and digitizer.',
    ],
    severity: 'medium',
  },
  {
    zone: 'front_camera_flex',
    label: 'Front Camera Flex Cable',
    description:
      'The earpiece/camera flex also carries proximity and ambient light sensor data; damage can cause erratic behavior.',
    repairSteps: [
      'Re-seat the front camera flex connector.',
      'Inspect flex for tears or creases.',
      'Ensure the earpiece mesh is clean and not dented.',
    ],
    severity: 'low',
  },
  {
    zone: 'battery_connector',
    label: 'Battery Connector',
    description:
      'An unstable power supply can cause random digitizer misfires. Always disconnect before working on other components.',
    repairSteps: [
      'Disconnect and re-connect the battery connector.',
      'Check battery health in Settings → Battery.',
      'Replace battery if swollen or capacity < 80%.',
    ],
    severity: 'low',
  },
  {
    zone: 'full_digitizer',
    label: 'Full Digitizer Replacement',
    description:
      'When ghost touches are spread across the entire screen after all other fixes, the digitizer IC has likely failed.',
    repairSteps: [
      'Order a genuine or high-quality OEM digitizer.',
      'Fully replace the display assembly.',
      'Recalibrate True Tone after replacement if applicable.',
    ],
    severity: 'high',
  },
];
