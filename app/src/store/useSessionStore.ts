import { create } from 'zustand';
import { DiagnosticSession, TouchPoint, GridCell, FaultyArea } from '../types';
import * as db from '../services/database';
import { GRID_ROWS, GRID_COLS } from '../constants';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildEmptyGrid(): GridCell[] {
  const cells: GridCell[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      cells.push({ row: r, col: c, status: 'untested', touchCount: 0 });
    }
  }
  return cells;
}

interface SessionState {
  sessions: DiagnosticSession[];
  activeSession: DiagnosticSession | null;
  isLoading: boolean;

  // Actions
  loadSessions: () => Promise<void>;
  startSession: (type: DiagnosticSession['type'], deviceModel?: string) => DiagnosticSession;
  endSession: (notes?: string) => Promise<void>;
  cancelSession: () => void;
  recordTouch: (point: Omit<TouchPoint, 'id'>) => void;
  markCellStatus: (row: number, col: number, status: GridCell['status']) => void;
  addFaultyArea: (area: Omit<FaultyArea, 'id'>) => void;
  deleteSession: (id: string) => Promise<void>;
  resetActiveSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,

  loadSessions: async () => {
    set({ isLoading: true });
    try {
      const sessions = await db.getSessions();
      set({ sessions, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  startSession: (type, deviceModel) => {
    const session: DiagnosticSession = {
      id: generateId(),
      type,
      status: 'active',
      startedAt: Date.now(),
      touchPoints: [],
      gridCells: type === 'grid' ? buildEmptyGrid() : undefined,
      faultyAreas: [],
      deviceModel,
    };
    set({ activeSession: session });
    return session;
  },

  endSession: async (notes) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const completed: DiagnosticSession = {
      ...activeSession,
      status: 'completed',
      endedAt: Date.now(),
      notes,
    };

    await db.saveSession(completed);

    set((s) => ({
      activeSession: null,
      sessions: [completed, ...s.sessions],
    }));
  },

  cancelSession: () => {
    set({ activeSession: null });
  },

  recordTouch: (point) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const tp: TouchPoint = { ...point, id: generateId() };

    set({
      activeSession: {
        ...activeSession,
        touchPoints: [...activeSession.touchPoints, tp],
      },
    });
  },

  markCellStatus: (row, col, status) => {
    const { activeSession } = get();
    if (!activeSession || !activeSession.gridCells) return;

    const updatedCells = activeSession.gridCells.map((cell) => {
      if (cell.row === row && cell.col === col) {
        return {
          ...cell,
          status,
          touchCount: cell.touchCount + 1,
          lastTouched: Date.now(),
        };
      }
      return cell;
    });

    set({
      activeSession: { ...activeSession, gridCells: updatedCells },
    });
  },

  addFaultyArea: (area) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const faultyArea: FaultyArea = { ...area, id: generateId() };
    set({
      activeSession: {
        ...activeSession,
        faultyAreas: [...(activeSession.faultyAreas ?? []), faultyArea],
      },
    });
  },

  deleteSession: async (id) => {
    await db.deleteSession(id);
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
    }));
  },

  resetActiveSession: () => set({ activeSession: null }),
}));
