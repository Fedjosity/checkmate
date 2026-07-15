/**
 * Time Control system for CheckMate.
 *
 * Format: "BaseMinutes+IncrementSeconds" (e.g. "3+2" = 3 min base, 2s increment).
 * Category is derived from total estimated time: base + (increment × 40).
 *   - Bullet: < 3 min
 *   - Blitz:  3–14 min
 *   - Rapid:  ≥ 15 min
 */

export interface TimeControlOption {
  /** Display ID, e.g. "3+2" */
  id: string;
  /** Category label */
  label: 'Bullet' | 'Blitz' | 'Rapid';
  /** Category key for ELO tracking */
  category: 'bullet' | 'blitz' | 'rapid';
  /** Base time in milliseconds */
  baseTimeMs: number;
  /** Increment per move in milliseconds */
  incrementMs: number;
}

export const TIME_CONTROL_PRESETS: TimeControlOption[] = [
  // ── Bullet ──
  { id: '1+0',   label: 'Bullet', category: 'bullet', baseTimeMs: 60_000,    incrementMs: 0 },
  { id: '1+1',   label: 'Bullet', category: 'bullet', baseTimeMs: 60_000,    incrementMs: 1_000 },
  { id: '2+1',   label: 'Bullet', category: 'bullet', baseTimeMs: 120_000,   incrementMs: 1_000 },
  // ── Blitz ──
  { id: '3+0',   label: 'Blitz',  category: 'blitz',  baseTimeMs: 180_000,   incrementMs: 0 },
  { id: '3+2',   label: 'Blitz',  category: 'blitz',  baseTimeMs: 180_000,   incrementMs: 2_000 },
  { id: '5+0',   label: 'Blitz',  category: 'blitz',  baseTimeMs: 300_000,   incrementMs: 0 },
  { id: '5+3',   label: 'Blitz',  category: 'blitz',  baseTimeMs: 300_000,   incrementMs: 3_000 },
  // ── Rapid ──
  { id: '10+0',  label: 'Rapid',  category: 'rapid',  baseTimeMs: 600_000,   incrementMs: 0 },
  { id: '10+5',  label: 'Rapid',  category: 'rapid',  baseTimeMs: 600_000,   incrementMs: 5_000 },
  { id: '15+10', label: 'Rapid',  category: 'rapid',  baseTimeMs: 900_000,   incrementMs: 10_000 },
  { id: '30+0',  label: 'Rapid',  category: 'rapid',  baseTimeMs: 1_800_000, incrementMs: 0 },
];

/** Special sentinel for "no timer" (bot games only) */
export const NO_TIMER_ID = 'unlimited';

/**
 * Resolve a time control ID to its full option object.
 * Returns `null` for the special "unlimited" ID (no timer).
 */
export function resolveTimeControl(id: string): TimeControlOption | null {
  if (id === NO_TIMER_ID) return null;
  for (let i = 0; i < TIME_CONTROL_PRESETS.length; i++) {
    if (TIME_CONTROL_PRESETS[i].id === id) {
      return TIME_CONTROL_PRESETS[i];
    }
  }
  throw new Error(`Unknown time control ID: ${id}`);
}
