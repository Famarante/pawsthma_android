import { Attack, InhalerInfo, InhalerLog } from '../types';

export const DEFAULT_INHALER_INFO: InhalerInfo = {
  dosage: '110mcg',
  lastCleaned: '2025-02-15',
  cleaningIntervalDays: 14,
};

export const DEFAULT_ATTACKS: Attack[] = [
  { id: 1, date: '2025-02-01', severity: 'mild', duration: 2, notes: 'After eating', addedBy: 'p1' },
  { id: 2, date: '2025-02-05', severity: 'moderate', duration: 5, notes: 'Night episode', addedBy: 'p2' },
  { id: 3, date: '2025-02-10', severity: 'mild', duration: 1, notes: '', addedBy: 'p1' },
  { id: 4, date: '2025-02-14', severity: 'severe', duration: 8, notes: 'Vet called', addedBy: 'p2' },
  { id: 5, date: '2025-02-18', severity: 'moderate', duration: 4, notes: '', addedBy: 'p1' },
  { id: 6, date: '2025-02-22', severity: 'mild', duration: 2, notes: 'Morning', addedBy: 'p2' },
];

export const DEFAULT_INHALER_LOGS: InhalerLog[] = [
  { id: 1, date: '2025-02-01', breaths: 2, dosage: '110mcg', addedBy: 'p1' },
  { id: 2, date: '2025-02-05', breaths: 3, dosage: '110mcg', addedBy: 'p2' },
  { id: 3, date: '2025-02-14', breaths: 3, dosage: '110mcg', addedBy: 'p2' },
  { id: 4, date: '2025-02-18', breaths: 2, dosage: '110mcg', addedBy: 'p1' },
  { id: 5, date: '2025-02-22', breaths: 2, dosage: '110mcg', addedBy: 'p2' },
];
