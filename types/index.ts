export type TriggerType = 'food' | 'exercise' | 'weather' | 'stress' | 'unknown';

export interface Attack {
  id: number;
  date: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: number; // in minutes (fractional)
  notes: string;
  addedBy: string;
  triggers?: TriggerType[];
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
  breed?: string;
  birthDate?: string;
  weight?: number;
  gender?: 'male' | 'female';
  vetName?: string;
  vetClinic?: string;
  vetPhone?: string;
  vetAddress?: string;
  diagnosis?: string;
  photo?: string; // base64 data URI
  medications?: { name: string; dosage: string; frequency: string }[];
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

export type ModalType = 'attack' | 'editAttack' | 'inhaler' | 'editInhaler' | 'chooser' | null;

export interface AttackForm {
  date: string;
  severity: 'mild' | 'moderate' | 'severe';
  durationMin: string;
  durationSec: string;
  notes: string;
  triggers: TriggerType[];
}

export interface InhalerForm {
  date: string;
  breaths: number;
  dosage: string;
}
