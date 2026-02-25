/**
 * Local SQLite database service using expo-sqlite.
 * Designed with the same schema that will be mirrored in the
 * future PostgreSQL backend, making migration straightforward.
 */
import * as SQLite from 'expo-sqlite';
import { DiagnosticSession, TouchPoint, GhostTouchEvent } from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('touch_diagnostics.db');
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',
      started_at  INTEGER NOT NULL,
      ended_at    INTEGER,
      notes       TEXT,
      device_model TEXT,
      synced      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS touch_points (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      x           REAL NOT NULL,
      y           REAL NOT NULL,
      timestamp   INTEGER NOT NULL,
      pressure    REAL,
      is_ghost    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ghost_events (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      x           REAL NOT NULL,
      y           REAL NOT NULL,
      timestamp   INTEGER NOT NULL,
      duration    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_touch_session ON touch_points(session_id);
    CREATE INDEX IF NOT EXISTS idx_ghost_session ON ghost_events(session_id);
  `);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function saveSession(session: DiagnosticSession): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sessions
      (id, type, status, started_at, ended_at, notes, device_model)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    session.id,
    session.type,
    session.status,
    session.startedAt,
    session.endedAt ?? null,
    session.notes ?? null,
    session.deviceModel ?? null,
  );

  if (session.touchPoints.length > 0) {
    for (const tp of session.touchPoints) {
      await db.runAsync(
        `INSERT OR REPLACE INTO touch_points
          (id, session_id, x, y, timestamp, pressure, is_ghost)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        tp.id,
        session.id,
        tp.x,
        tp.y,
        tp.timestamp,
        tp.pressure ?? null,
        tp.isGhost ? 1 : 0,
      );
    }
  }
}

export async function getSessions(): Promise<DiagnosticSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    type: string;
    status: string;
    started_at: number;
    ended_at: number | null;
    notes: string | null;
    device_model: string | null;
  }>('SELECT * FROM sessions ORDER BY started_at DESC');

  return rows.map((r) => ({
    id: r.id,
    type: r.type as DiagnosticSession['type'],
    status: r.status as DiagnosticSession['status'],
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    notes: r.notes ?? undefined,
    deviceModel: r.device_model ?? undefined,
    touchPoints: [],
    faultyAreas: [],
  }));
}

export async function getSessionById(id: string): Promise<DiagnosticSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    type: string;
    status: string;
    started_at: number;
    ended_at: number | null;
    notes: string | null;
    device_model: string | null;
  }>('SELECT * FROM sessions WHERE id = ?', id);

  if (!row) return null;

  const tpRows = await db.getAllAsync<{
    id: string;
    x: number;
    y: number;
    timestamp: number;
    pressure: number | null;
    is_ghost: number;
  }>('SELECT * FROM touch_points WHERE session_id = ?', id);

  const touchPoints: TouchPoint[] = tpRows.map((t) => ({
    id: t.id,
    x: t.x,
    y: t.y,
    timestamp: t.timestamp,
    pressure: t.pressure ?? undefined,
    isGhost: t.is_ghost === 1,
  }));

  return {
    id: row.id,
    type: row.type as DiagnosticSession['type'],
    status: row.status as DiagnosticSession['status'],
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    notes: row.notes ?? undefined,
    deviceModel: row.device_model ?? undefined,
    touchPoints,
    faultyAreas: [],
  };
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
}
