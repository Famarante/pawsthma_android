import { Cat, Household, InhalerInfo, Profile } from '../types';
import { EMOJIS, PCOLS } from '../constants/colors';

const DEFAULT_INHALER_INFO: InhalerInfo = {
  dosage: '110mcg',
  lastCleaned: '2025-02-15',
  cleaningIntervalDays: 14,
};

// ─── Date utilities ─────────────────────────────────────────────────────────

export const today = (): string => new Date().toISOString().split('T')[0];

export const parseLocalDate = (value: string | Date | number): Date => {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value !== 'string') return new Date(value);
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

export const fmtLocalDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmt = (d: string | Date, lang: string): string =>
  parseLocalDate(d).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });

export const fmtWeekRange = (startKey: string, lang: string): string => {
  const start = parseLocalDate(startKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${fmt(start, lang)}–${fmt(end, lang)}`;
};

export const fmtDuration = (minutes: number, _lang?: string): string => {
  const totalSec = Math.max(0, Math.round(Number(minutes || 0) * 60));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (!secs) return `${mins} min`;
  return `${mins}m ${secs}s`;
};

export const daysBetween = (a: string, b: string): number =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

// ─── ID generators ──────────────────────────────────────────────────────────

export const nextId = (arr: { id: number }[]): number =>
  arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1;

export const mkId = (): string => 'p' + Math.random().toString(36).slice(2, 7);

export const mkHouseholdId = (): string =>
  (
    (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
    `h_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 6)}`
  )
    .replace(/-/g, '')
    .slice(0, 16);

export const mkInviteCode = (): string =>
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── Normalization ──────────────────────────────────────────────────────────

export const normProfiles = (profiles: unknown): Profile[] | null => {
  if (!Array.isArray(profiles)) return null;
  return (profiles as Profile[])
    .filter(Boolean)
    .map((p, idx) => ({
      id: typeof p.id === 'string' && p.id ? p.id : mkId(),
      name: (p.name || '').toString(),
      emoji: p.emoji || EMOJIS[idx % EMOJIS.length],
      color: p.color || PCOLS[idx % PCOLS.length],
    }));
};

export const normMembers = (members: unknown): string[] => {
  if (!Array.isArray(members)) return [];
  return [
    ...new Set(
      (members as (string | { uid: string })[])
        .map((m) => (typeof m === 'string' ? m : m?.uid))
        .filter((uid): uid is string => typeof uid === 'string' && uid.trim().length > 0),
    ),
  ];
};

export const normMemberKeys = (
  memberKeys: unknown,
  members: string[] = [],
): Record<string, true> => {
  if (memberKeys && typeof memberKeys === 'object' && !Array.isArray(memberKeys)) {
    return Object.entries(memberKeys as Record<string, unknown>).reduce(
      (acc, [uid, val]) => {
        if (uid && val === true) acc[uid] = true;
        return acc;
      },
      {} as Record<string, true>,
    );
  }
  return members.reduce(
    (acc, uid) => {
      acc[uid] = true;
      return acc;
    },
    {} as Record<string, true>,
  );
};

export const mkCat = (idx: number, name: string, data: Partial<Cat> = {}): Cat => ({
  id: data.id || `c${idx + 1}`,
  name: (name || data.name || `Cat ${idx + 1}`).toString(),
  attacks: Array.isArray(data.attacks) ? data.attacks : [],
  inhalerLogs: Array.isArray(data.inhalerLogs) ? data.inhalerLogs : [],
  inhalerInfo: { ...DEFAULT_INHALER_INFO, ...(data.inhalerInfo || {}) },
});

export const mkHousehold = (name: string, data: Partial<Household> = {}): Household => {
  const members = normMembers(data.members);
  return {
    id: (data.id || mkHouseholdId()).toString(),
    name: (name || data.name || 'Home').toString(),
    inviteCode: (data.inviteCode || mkInviteCode()).toString().toUpperCase(),
    profiles: normProfiles(data.profiles),
    members,
    memberKeys: normMemberKeys(data.memberKeys, members),
    cats: Array.isArray(data.cats)
      ? data.cats.map((c, idx) => mkCat(idx, c?.name || '', c))
      : [],
  };
};

export const normalizeData = (raw: unknown): { households: Record<string, Household> } => {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const homes =
    src.households && typeof src.households === 'object'
      ? (src.households as Record<string, unknown>)
      : {};
  return {
    households: Object.entries(homes).reduce(
      (acc, [k, v]) => {
        const h = v as Partial<Household>;
        acc[k] = mkHousehold(h?.name || k, h || {});
        return acc;
      },
      {} as Record<string, Household>,
    ),
  };
};

// ─── Weekly chart data ───────────────────────────────────────────────────────

export interface WeekBucket {
  label: string;
  week: string;
  mild: number;
  moderate: number;
  severe: number;
}

export const buildWeeklyData = (attacks: Attack[], lang: string): WeekBucket[] => {
  const m: Record<string, WeekBucket> = {};
  const sorted = [...attacks].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach((a) => {
    const d = parseLocalDate(a.date);
    const weekStart = new Date(d);
    const mondayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    const w = fmtLocalDateKey(weekStart);
    if (!m[w]) m[w] = { week: w, label: fmtWeekRange(w, lang), mild: 0, moderate: 0, severe: 0 };
    m[w][a.severity]++;
  });
  return Object.values(m).slice(-6);
};

// ─── Misc ────────────────────────────────────────────────────────────────────

export const isPermissionErr = (err: unknown): boolean =>
  /permission|denied|auth\/unauthorized|PERMISSION_DENIED/i.test(
    `${(err as { code?: string })?.code || ''} ${(err as { message?: string })?.message || ''}`,
  );

export const inhalerInfoDefaults: InhalerInfo = {
  dosage: '110mcg',
  lastCleaned: today(),
  cleaningIntervalDays: 14,
};
