export const G = {
  bg: '#F9F9F9',
  bgCard: '#FFFFFF',
  bgInput: '#F7FAFC',
  bgElevated: '#FFFFFF',
  bgHeader: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceHero: 'rgba(255,126,103,0.08)',
  border: '#E2E8F0',
  borderBright: 'rgba(255,126,103,0.35)',
  borderMint: 'rgba(78,205,196,0.30)',
  borderCoral: 'rgba(255,107,107,0.30)',
  borderIndigo: 'rgba(139,92,246,0.25)',
  primary: '#FF7E67',
  amber: '#f5a623',
  golden: '#FBBF24',
  coral: '#ff6b6b',
  mint: '#4ecdc4',
  indigo: '#8b5cf6',
  text: '#2D3436',
  sub: '#636E72',
  muted: '#94A3B8',
  dim: '#CBD5E1',
  bBright: 'rgba(255,126,103,0.35)',
} as const;

export const SEV = {
  mild: '#4ecdc4',
  moderate: '#f5a623',
  severe: '#ff6b6b',
} as const;

export const SEV_BG = {
  mild: 'rgba(78,205,196,0.14)',
  moderate: 'rgba(245,166,35,0.14)',
  severe: 'rgba(255,107,107,0.14)',
} as const;

export const SEV_TEXT = {
  mild: '#2BA89E',
  moderate: '#D48E1A',
  severe: '#E04545',
} as const;

export const SEV_BORDER = {
  mild: 'rgba(78,205,196,0.30)',
  moderate: 'rgba(245,166,35,0.30)',
  severe: 'rgba(255,107,107,0.30)',
} as const;

export const SHADOWS = {
  amber:  { shadowColor: '#f5a623', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 4 },
  coral:  { shadowColor: '#ff6b6b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 4 },
  primary:{ shadowColor: '#FF7E67', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  mint:   { shadowColor: '#4ecdc4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 4 },
  indigo: { shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 4 },
  card:   { shadowColor: '#000',    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,  elevation: 2 },
  soft:   { shadowColor: '#000',    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,  elevation: 1 },
} as const;

export const GRADIENTS = {
  heroAmber:    ['rgba(255,126,103,0.12)',  'rgba(255,126,103,0.03)'] as const,
  modalAttack:  ['rgba(255,107,107,0.10)', 'rgba(255,107,107,0.00)'] as const,
  modalInhaler: ['rgba(78,205,196,0.10)',  'rgba(78,205,196,0.00)'] as const,
  bgSplash:     ['#FFFFFF', '#FFF5F2'] as const,
} as const;

export const PCOLS = [
  '#f5a623',
  '#f472b6',
  '#4ecdc4',
  '#a78bfa',
  '#34d399',
  '#fb923c',
  '#60a5fa',
  '#f87171',
] as const;

export const EMOJIS = [
  '🧑', '👩', '👨', '🧔', '👱', '🧕',
  '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '🧑‍🦳', '🧑‍🦲',
  '🐱', '🐶', '🌟', '🌻', '🦋', '🐢',
  '🐠', '🐇', '🦊', '🐻', '🎸', '🎨', '⚽', '🎮',
] as const;
