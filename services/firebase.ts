import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  get,
  set,
  onValue,
  update,
  Database,
} from 'firebase/database';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  Auth,
  User,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Household } from '../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC9G95r3-vYEvSF8SjQgYenfbSwexsoSHk',
  authDomain: 'pawsthma.firebaseapp.com',
  projectId: 'pawsthma',
  databaseURL: 'https://pawsthma-default-rtdb.europe-west1.firebasedatabase.app/',
  storageBucket: 'pawsthma.firebasestorage.app',
  messagingSenderId: '416458724436',
  appId: '1:416458724436:web:305b100e62429fbd7189c1',
};

export const FB_ON = FIREBASE_CONFIG.apiKey !== 'PASTE_YOUR_API_KEY_HERE';

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

if (FB_ON) {
  try {
    const alreadyInit = getApps().length > 0;
    app = alreadyInit ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    auth = alreadyInit
      ? getAuth(app)
      : initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });
    console.log('Firebase connected');
  } catch (e) {
    console.error('Firebase init error:', e);
  }
}

// ─── Refs ────────────────────────────────────────────────────────────────────

const userRef = (uid: string) => ref(db!, `pawsthma/users/${uid}`);
const homeRef = (key: string) => ref(db!, `pawsthma/households/${key}`);
const inviteRef = (code: string) => ref(db!, `pawsthma/invites/${code}`);

// ─── User meta ───────────────────────────────────────────────────────────────

export const fbLoadUserMeta = async (uid: string): Promise<Record<string, unknown> | null> => {
  if (!db) return null;
  const s = await get(userRef(uid));
  return s.val();
};

export const fbSaveUserMeta = async (
  uid: string,
  meta: Record<string, unknown>,
): Promise<boolean> => {
  if (!db) return false;
  await update(userRef(uid), meta);
  return true;
};

// ─── Household ───────────────────────────────────────────────────────────────

export const fbLoad = async (key: string): Promise<Household | null> => {
  if (!db) return null;
  const s = await get(homeRef(key));
  return s.val();
};

export const fbSave = async (key: string, d: Household): Promise<boolean> => {
  if (!db) return false;
  await set(homeRef(key), d);
  return true;
};

export const fbSubscribe = (
  key: string,
  cb: (data: Household) => void,
): (() => void) => {
  if (!db) return () => {};
  const unsub = onValue(homeRef(key), (s) => {
    const v = s.val();
    if (v) cb(v);
  });
  return unsub;
};

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface InvitePayload {
  code: string;
  householdId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
}

export const fbCreateInvite = async (payload: InvitePayload): Promise<boolean> => {
  if (!db) return false;
  await set(inviteRef(payload.code), {
    ...payload,
    usedBy: null,
    usedAt: null,
  });
  return true;
};

export interface RedeemResult {
  ok: boolean;
  reason?: string;
  householdId?: string;
}

export const fbRedeemInvite = async (args: {
  code: string;
  uid: string;
}): Promise<RedeemResult> => {
  if (!db) return { ok: false, reason: 'not-configured' };
  const snap = await get(inviteRef(args.code));
  const invite = snap.val() as {
    usedBy: string | null;
    expiresAt: number | null;
    householdId: string;
  } | null;
  if (!invite) return { ok: false, reason: 'not-found' };
  if (invite.usedBy) return { ok: false, reason: 'used' };
  if (invite.expiresAt && Date.now() > invite.expiresAt) return { ok: false, reason: 'expired' };
  await update(inviteRef(args.code), { usedBy: args.uid, usedAt: Date.now() });
  return { ok: true, householdId: invite.householdId };
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const fbAuthObserve = (cb: (user: User | null) => void): (() => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb);
};

export const fbSignIn = async (email: string, password: string) => {
  if (!auth) throw new Error('auth-not-configured');
  return signInWithEmailAndPassword(auth, email, password);
};

export const fbSignUp = async (email: string, password: string) => {
  if (!auth) throw new Error('auth-not-configured');
  return createUserWithEmailAndPassword(auth, email, password);
};

export const fbSignOut = async () => {
  if (!auth) return;
  return signOut(auth);
};

// ─── FCM token ───────────────────────────────────────────────────────────────

export const fbSaveFcmToken = async (uid: string, token: string): Promise<void> => {
  if (!db) return;
  await update(userRef(uid), { fcmToken: token });
};
