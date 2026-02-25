// ─── Touch Point ───────────────────────────────────────────────────────────────
export interface TouchPoint {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
  isGhost?: boolean;
}

// ─── Grid Cell ─────────────────────────────────────────────────────────────────
export type CellStatus = 'untested' | 'ok' | 'faulty' | 'ghost';

export interface GridCell {
  row: number;
  col: number;
  status: CellStatus;
  touchCount: number;
  lastTouched?: number;
}

// ─── Diagnostic Session ────────────────────────────────────────────────────────
export type SessionType = 'grid' | 'ghost_monitor' | 'multi_touch';
export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface DiagnosticSession {
  id: string;
  type: SessionType;
  status: SessionStatus;
  startedAt: number;
  endedAt?: number;
  touchPoints: TouchPoint[];
  gridCells?: GridCell[];
  faultyAreas?: FaultyArea[];
  notes?: string;
  deviceModel?: string;
}

// ─── Faulty Area ───────────────────────────────────────────────────────────────
export interface FaultyArea {
  id: string;
  label: string;
  xPercent: number;    // 0-100 relative to screen width
  yPercent: number;    // 0-100 relative to screen height
  widthPercent: number;
  heightPercent: number;
  severity: 'low' | 'medium' | 'high';
  hardwareZone?: HardwareZone;
}

// ─── Hardware Zone ─────────────────────────────────────────────────────────────
export type HardwareZone =
  | 'digitizer_top'
  | 'digitizer_bottom'
  | 'digitizer_left_edge'
  | 'digitizer_right_edge'
  | 'lcd_connector'
  | 'battery_connector'
  | 'front_camera_flex'
  | 'home_button_flex'
  | 'full_digitizer';

export interface HardwareGuideItem {
  zone: HardwareZone;
  label: string;
  description: string;
  repairSteps: string[];
  severity: 'low' | 'medium' | 'high';
}

// ─── Ghost Touch Event ─────────────────────────────────────────────────────────
export interface GhostTouchEvent {
  id: string;
  sessionId: string;
  x: number;
  y: number;
  timestamp: number;
  duration: number;
}

// ─── Heatmap Data ──────────────────────────────────────────────────────────────
export interface HeatmapPoint {
  x: number;
  y: number;
  weight: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
