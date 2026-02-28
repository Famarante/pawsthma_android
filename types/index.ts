export interface Attack {
  id: number;
  date: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: number; // in minutes (fractional)
  notes: string;
  addedBy: string;
}

export interface InhalerLog {
  id: number;
  date: string;
  breaths: number;
  dosage: string;
  addedBy: string;
}

export interface InhalerInfo {
  dosage: string;
  lastCleaned: string;
  cleaningIntervalDays: number;
}

export interface Cat {
  id: string;
  name: string;
  attacks: Attack[];
  inhalerLogs: InhalerLog[];
  inhalerInfo: InhalerInfo;
}

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  cats: Cat[];
  profiles: Profile[] | null;
  members: string[];
  memberKeys: Record<string, true>;
}

export interface AppData {
  households: Record<string, Household>;
}

export type SyncStatus = 'loading' | 'live' | 'updated' | 'synced' | 'error' | 'demo';

export type TabId = 'dashboard' | 'attacks' | 'inhaler' | 'insights';

export type ModalType = 'attack' | 'editAttack' | 'inhaler' | 'editInhaler' | null;

export interface AttackForm {
  date: string;
  severity: 'mild' | 'moderate' | 'severe';
  durationMin: string;
  durationSec: string;
  notes: string;
}

export interface InhalerForm {
  date: string;
  breaths: number;
  dosage: string;
}
