import { create } from 'zustand';
import { User } from 'firebase/auth';
import {
  FB_ON,
  fbAuthObserve,
  fbSignIn,
  fbSignOut,
  fbSignUp,
  fbLoadUserMeta,
  fbSaveUserMeta,
  fbLoad,
} from '../services/firebase';
import { getDeviceHome, setDeviceHome, clearDeviceHome, getOrCreateDeviceId, saveLang, loadLang } from '../services/storage';

interface AuthState {
  user: User | null;
  authReady: boolean;
  uid: string | null;
  lang: string;
  deviceId: string;
  userHomes: string[];
  homeNames: Record<string, string>;
  activeHome: string | null;
  authed: boolean;
  metaReady: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  setLang: (lang: string) => void;
  setDeviceId: (id: string) => void;
  setUserHomes: (homes: string[]) => void;
  setHomeNames: (names: Record<string, string>) => void;
  setActiveHome: (home: string | null) => void;
  setAuthed: (authed: boolean) => void;
  setMetaReady: (ready: boolean) => void;
  logout: () => Promise<void>;
  signIn: (email: string, password: string, signup: boolean) => Promise<string | null>;
  init: () => Promise<void>;
  loadUserMeta: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authReady: !FB_ON,
  uid: null,
  lang: 'en',
  deviceId: 'device_fallback',
  userHomes: [],
  homeNames: {},
  activeHome: null,
  authed: false,
  metaReady: false,

  setUser: (user) => set({ user, uid: user?.uid || null }),
  setAuthReady: (authReady) => set({ authReady }),
  setLang: (lang) => {
    set({ lang });
    saveLang(lang);
  },
  setDeviceId: (deviceId) => set({ deviceId }),
  setUserHomes: (userHomes) => set({ userHomes }),
  setHomeNames: (homeNames) => set({ homeNames }),
  setActiveHome: (activeHome) => set({ activeHome }),
  setAuthed: (authed) => set({ authed }),
  setMetaReady: (metaReady) => set({ metaReady }),

  init: async () => {
    // Load device ID
    const deviceId = await getOrCreateDeviceId();
    set({ deviceId });

    // Load saved language
    const savedLang = await loadLang();
    if (savedLang) set({ lang: savedLang });

    if (!FB_ON) {
      set({ authReady: true, metaReady: true });
      return;
    }

    // Observe Firebase auth
    fbAuthObserve(async (u) => {
      set({ user: u || null, uid: u?.uid || null });
      if (!u) {
        set({ authed: false, activeHome: null, authReady: true, metaReady: true });
      } else {
        set({ authReady: true });
      }
    });
  },

  loadUserMeta: async () => {
    const { user, deviceId } = get();
    if (!user?.uid) return;

    try {
      const meta = (await fbLoadUserMeta(user.uid)) || {};
      const linkedHomes =
        meta.households && typeof meta.households === 'object'
          ? Object.keys(meta.households as Record<string, unknown>)
          : [];

      set({ userHomes: linkedHomes });

      // Load home names
      if (linkedHomes.length) {
        const entries = await Promise.all(
          linkedHomes.map(async (id) => {
            try {
              const h = await fbLoad(id);
              return [id, (h?.name || id).toString()];
            } catch {
              return [id, id];
            }
          }),
        );
        set({ homeNames: Object.fromEntries(entries) });
      } else {
        set({ homeNames: {} });
      }

      // Restore remembered household
      const remembered = await getDeviceHome(deviceId);
      const initialHome =
        remembered && linkedHomes.includes(remembered) ? remembered : linkedHomes[0] || null;

      set({ activeHome: initialHome, authed: !!initialHome, metaReady: true });

      if (initialHome) {
        await setDeviceHome(deviceId, initialHome);
      }
    } catch (err) {
      console.error('loadUserMeta error:', err);
      set({ metaReady: true });
    }
  },

  logout: async () => {
    const { deviceId } = get();
    await fbSignOut().catch(() => null);
    await clearDeviceHome(deviceId);
    set({ authed: false, uid: null, activeHome: null });
  },

  signIn: async (email, password, signup) => {
    if (!FB_ON) return 'Firebase is not configured';
    try {
      if (signup) await fbSignUp(email, password);
      else await fbSignIn(email, password);
      return null;
    } catch (err: unknown) {
      const msg = `${(err as { code?: string })?.code || ''} ${(err as { message?: string })?.message || ''}`;
      if (/CONFIGURATION_NOT_FOUND/i.test(msg)) return 'authConfigMissing';
      if (/auth\/(invalid-credential|wrong-password|user-not-found)/i.test(msg)) return 'authInvalidCreds';
      if (/auth\/weak-password/i.test(msg)) return 'authWeakPassword';
      if (/auth\/operation-not-allowed/i.test(msg)) return 'authConfigMissing';
      return 'authError';
    }
  },
}));
