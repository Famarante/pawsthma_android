import { Attack, Cat, Household, InhalerInfo, Profile } from '../types';
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
  const locale = lang === 'pt' ? 'pt-PT' : 'en-GB';
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMon = start.toLocaleDateString(locale, { month: 'short' });
  const endMon = end.toLocaleDateString(locale, { month: 'short' });
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMon}`;
  }
  return `${startDay} ${startMon}–${endDay} ${endMon}`;
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
  return Object.values(m).slice(-5);
};

// ─── Daily chart data (last 7 days) ─────────────────────────────────────────

export interface DayBucket {
  date: string;       // YYYY-MM-DD (local)
  dayIndex: number;   // 0 = Sunday … 6 = Saturday
  mild: number;
  moderate: number;
  severe: number;
}

export const buildDailyData = (attacks: Attack[]): DayBucket[] => {
  const result: DayBucket[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = fmtLocalDateKey(d);
    const day = attacks.filter((a) => a.date.split('T')[0] === key);
    result.push({
      date: key,
      dayIndex: d.getDay(),
      mild: day.filter((a) => a.severity === 'mild').length,
      moderate: day.filter((a) => a.severity === 'moderate').length,
      severe: day.filter((a) => a.severity === 'severe').length,
    });
  }
  return result;
};

// ─── Attack grouping ────────────────────────────────────────────────────────

export interface AttackGroup {
  label: string;
  dateKey: string;
  items: Attack[];
}

export const groupAttacksByDate = (attacks: Attack[], lang: string): AttackGroup[] => {
  const todayKey = today();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = fmtLocalDateKey(yesterdayDate);

  const groups: Record<string, Attack[]> = {};
  const sorted = [...attacks].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((a) => {
    const dateKey = a.date.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(a);
  });

  return Object.entries(groups).map(([dateKey, items]) => {
    let label: string;
    if (dateKey === todayKey) label = 'Today';
    else if (dateKey === yesterdayKey) label = 'Yesterday';
    else label = fmt(dateKey, lang);
    return { label, dateKey, items };
  });
};

// ─── Week trend helper ───────────────────────────────────────────────────────

export const buildWeekTrend = (attacks: Attack[]): { thisWeek: number; lastWeek: number; diff: number } => {
  const now = new Date();
  let thisWeek = 0;
  let lastWeek = 0;
  attacks.forEach((a) => {
    const diff = Math.floor((now.getTime() - new Date(a.date).getTime()) / 86400000);
    if (diff >= 0 && diff < 7) thisWeek++;
    else if (diff >= 7 && diff < 14) lastWeek++;
  });
  return { thisWeek, lastWeek, diff: thisWeek - lastWeek };
};

// ─── Attack-free streak ──────────────────────────────────────────────────────

export const attackFreeStreakDays = (attacks: Attack[]): number => {
  if (!attacks.length) return 0;
  const todayKey = today();
  const sorted = [...attacks].sort((a, b) => b.date.localeCompare(a.date));
  const lastDate = sorted[0].date.split('T')[0];
  if (lastDate === todayKey) return 0;
  return daysBetween(lastDate, todayKey);
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
