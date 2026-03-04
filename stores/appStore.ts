import { create } from 'zustand';
import {
  AppData,
  AttackForm,
  Cat,
  Household,
  InhalerForm,
  InhalerInfo,
  ModalType,
  Profile,
  SyncStatus,
} from '../types';
import {
  FB_ON,
  fbLoad,
  fbSave,
  fbSubscribe,
  fbCreateInvite,
  fbRedeemInvite,
  fbSaveUserMeta,
} from '../services/firebase';
import { lsLoad, lsSave, setDeviceHome, clearDeviceHome, getDeviceHome } from '../services/storage';
import {
  mkCat,
  mkHousehold,
  mkHouseholdId,
  mkId,
  mkInviteCode,
  nextId,
  normalizeData,
  isPermissionErr,
  today,
} from '../utils/data';
import { DEFAULT_ATTACKS, DEFAULT_INHALER_INFO, DEFAULT_INHALER_LOGS } from '../utils/defaults';
import { PCOLS } from '../constants/colors';

interface AppState {
  data: AppData | null;
  sync: SyncStatus;
  lastSyncTs: number | null;
  syncSecs: number;

  // UI state
  modal: ModalType;
  showMgr: boolean;
  showCatSwitcher: boolean;
  catId: string | null;

  // Form state
  attackForm: AttackForm;
  inhalerForm: InhalerForm;
  editAttackId: number | null;
  editInhalerId: number | null;
  inhalerInfoForm: InhalerInfo;

  // Derived (updated on data change)
  _dataRef: AppData | null;
  _unsubRef: (() => void) | null;

  // Actions
  setData: (data: AppData) => void;
  setSync: (s: SyncStatus) => void;
  setCatId: (id: string | null) => void;
  setModal: (modal: ModalType) => void;
  setShowMgr: (show: boolean) => void;
  setShowCatSwitcher: (show: boolean) => void;
  setAttackForm: (f: Partial<AttackForm>) => void;
  setInhalerForm: (f: Partial<InhalerForm>) => void;
  setInhalerInfoForm: (f: Partial<InhalerInfo>) => void;
  setEditAttackId: (id: number | null) => void;
  setEditInhalerId: (id: number | null) => void;
  tickSync: () => void;

  // Data actions
  doSave: (updater: (d: AppData) => AppData, homeKey: string, uid: string | null) => Promise<void>;
  loadDemo: () => Promise<void>;
  subscribeToHome: (homeKey: string) => void;
  unsubscribeHome: () => void;

  addAttack: (homeKey: string, catId: string, uid: string | null) => Promise<void>;
  saveEditedAttack: (homeKey: string, catId: string, uid: string | null) => Promise<void>;
  deleteAttack: (id: number, homeKey: string, catId: string, uid: string | null) => Promise<void>;
  addInhaler: (homeKey: string, catId: string, uid: string | null) => Promise<void>;
  saveEditedInhaler: (homeKey: string, catId: string) => Promise<void>;
  deleteInhaler: (id: number, homeKey: string, catId: string, uid: string | null) => Promise<void>;
  saveInhalerInfo: (homeKey: string, catId: string, uid: string | null) => Promise<void>;
  saveProfiles: (profiles: Profile[], homeKey: string, uid: string | null) => Promise<void>;
  saveCatInfo: (catInfo: Partial<Cat>, homeKey: string, catId: string, uid: string | null) => Promise<void>;
  addCat: (name: string, homeKey: string, uid: string | null) => Promise<string>;
  saveMedications: (meds: { name: string; dosage: string; frequency: string }[], homeKey: string, catId: string, uid: string | null) => Promise<void>;

  handleHouseholdAction: (
    payload: HouseholdActionPayload,
    user: { uid?: string; email?: string; displayName?: string } | null,
    deviceId: string,
    userHomes: string[],
    addUserHome: (id: string, name: string) => void,
  ) => Promise<HouseholdActionResult>;
  createInviteCode: (homeKey: string, uid: string | null) => Promise<string | null>;
}

export interface HouseholdActionPayload {
  action: 'open' | 'create' | 'join';
  householdId?: string;
  householdName?: string;
  inviteCode?: string;
}

export interface HouseholdActionResult {
  ok: boolean;
  reason?: string;
  householdId?: string;
}

const DEFAULT_ATTACK_FORM: AttackForm = {
  date: today(),
  severity: 'mild',
  durationMin: '',
  durationSec: '0',
  notes: '',
  triggers: [],
};

const DEFAULT_INHALER_FORM: InhalerForm = {
  date: today(),
  breaths: 2,
  dosage: '110mcg',
};

export const useAppStore = create<AppState>((set, get) => ({
  data: null,
  sync: 'loading',
  lastSyncTs: null,
  syncSecs: 0,
  modal: null,
  showMgr: false,
  showCatSwitcher: false,
  catId: null,
  attackForm: { ...DEFAULT_ATTACK_FORM },
  inhalerForm: { ...DEFAULT_INHALER_FORM },
  editAttackId: null,
  editInhalerId: null,
  inhalerInfoForm: { ...DEFAULT_INHALER_INFO },
  _dataRef: null,
  _unsubRef: null,

  setData: (data) => set({ data, _dataRef: data }),
  setSync: (sync) => set({ sync }),
  setCatId: (catId) => set({ catId }),
  setModal: (modal) => set({ modal }),
  setShowMgr: (showMgr) => set({ showMgr }),
  setShowCatSwitcher: (showCatSwitcher) => set({ showCatSwitcher }),
  setAttackForm: (f) => set((s) => ({ attackForm: { ...s.attackForm, ...f } })),
  setInhalerForm: (f) => set((s) => ({ inhalerForm: { ...s.inhalerForm, ...f } })),
  setInhalerInfoForm: (f) => set((s) => ({ inhalerInfoForm: { ...s.inhalerInfoForm, ...f } })),
  setEditAttackId: (editAttackId) => set({ editAttackId }),
  setEditInhalerId: (editInhalerId) => set({ editInhalerId }),

  tickSync: () => {
    const { lastSyncTs, sync } = get();
    if (lastSyncTs && sync === 'live') {
      const s = Math.floor((Date.now() - lastSyncTs) / 1000);
      set({ syncSecs: s });
      if (s > 8) set({ sync: 'synced' });
    }
  },

  doSave: async (updater, homeKey, uid) => {
    const { _dataRef } = get();
    const next = updater(_dataRef!);
    set({ data: next, _dataRef: next });
    if (FB_ON && fbSave && uid) {
      set({ sync: 'loading' });
      const ok = await fbSave(homeKey, next?.households?.[homeKey]!).catch(() => false);
      set({ sync: ok ? 'live' : 'error', lastSyncTs: ok ? Date.now() : get().lastSyncTs, syncSecs: 0 });
    } else {
      await lsSave(next);
    }
  },

  loadDemo: async () => {
    const saved = await lsLoad();
    const raw = saved || {
      households: {
        demo: {
          id: 'demo',
          name: 'Demo Home',
          inviteCode: 'DEMO-0000',
          profiles: [
            { id: 'p1', name: 'Person 1', emoji: '👨', color: PCOLS[0] },
            { id: 'p2', name: 'Person 2', emoji: '👩', color: PCOLS[1] },
          ],
          members: ['p1', 'p2'],
          memberKeys: { p1: true, p2: true },
          cats: [
            {
              id: 'c1',
              name: 'Whiskers',
              attacks: DEFAULT_ATTACKS,
              inhalerLogs: DEFAULT_INHALER_LOGS,
              inhalerInfo: DEFAULT_INHALER_INFO,
            },
          ],
        },
      },
    };
    const normalized = normalizeData(raw);
    set({ data: normalized, _dataRef: normalized, sync: 'demo' });
    await lsSave(normalized);
  },

  subscribeToHome: (homeKey) => {
    const { _unsubRef } = get();
    if (_unsubRef) _unsubRef();

    const unsub = fbSubscribe(homeKey, (inc) => {
      const n = normalizeData({ households: { [homeKey]: inc } });
      set({ data: n, _dataRef: n, sync: 'updated', lastSyncTs: Date.now(), syncSecs: 0 });
      setTimeout(() => set({ sync: 'live' }), 2500);
    });
    set({ _unsubRef: unsub });
  },

  unsubscribeHome: () => {
    const { _unsubRef } = get();
    if (_unsubRef) {
      _unsubRef();
      set({ _unsubRef: null });
    }
  },

  // ─── Cat mutations ────────────────────────────────────────────────────────

  addAttack: async (homeKey, catId, uid) => {
    const { attackForm, doSave } = get();
    const mins = Math.max(0, Number(attackForm.durationMin || 0));
    const secs = Math.min(59, Math.max(0, Number(attackForm.durationSec || 0)));
    const duration = (mins * 60 + secs) / 60;
    if (duration <= 0) return;
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId
                ? {
                    ...c,
                    attacks: [
                      ...c.attacks,
                      {
                        id: nextId(c.attacks),
                        date: attackForm.date,
                        severity: attackForm.severity,
                        duration,
                        notes: attackForm.notes,
                        addedBy: uid || '',
                        triggers: attackForm.triggers || [],
                      },
                    ],
                  }
                : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
    set({ modal: null, attackForm: { ...DEFAULT_ATTACK_FORM, date: today() } });
  },

  saveEditedAttack: async (homeKey, catId, uid) => {
    const { attackForm, editAttackId, doSave } = get();
    if (!editAttackId) return;
    const mins = Math.max(0, Number(attackForm.durationMin || 0));
    const secs = Math.min(59, Math.max(0, Number(attackForm.durationSec || 0)));
    const duration = (mins * 60 + secs) / 60;
    if (duration <= 0) return;
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId
                ? {
                    ...c,
                    attacks: c.attacks.map((a) =>
                      a.id === editAttackId
                        ? { ...a, date: attackForm.date, severity: attackForm.severity, duration, notes: attackForm.notes, triggers: attackForm.triggers || [] }
                        : a,
                    ),
                  }
                : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
    set({ modal: null, editAttackId: null, attackForm: { ...DEFAULT_ATTACK_FORM, date: today() } });
  },

  deleteAttack: async (id, homeKey, catId, uid) => {
    const { doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId ? { ...c, attacks: c.attacks.filter((a) => a.id !== id) } : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
  },

  addInhaler: async (homeKey, catId, uid) => {
    const { inhalerForm, doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId
                ? {
                    ...c,
                    inhalerLogs: [
                      ...c.inhalerLogs,
                      {
                        id: nextId(c.inhalerLogs),
                        date: inhalerForm.date,
                        breaths: Number(inhalerForm.breaths),
                        dosage: inhalerForm.dosage,
                        addedBy: uid || '',
                      },
                    ],
                  }
                : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
    set({ modal: null });
  },

  saveEditedInhaler: async (homeKey, catId) => {
    const { inhalerForm, editInhalerId, doSave } = get();
    if (!editInhalerId) return;
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId
                ? {
                    ...c,
                    inhalerLogs: c.inhalerLogs.map((l) =>
                      l.id === editInhalerId
                        ? {
                            ...l,
                            date: inhalerForm.date,
                            breaths: Math.max(1, Number(inhalerForm.breaths) || 1),
                            dosage: inhalerForm.dosage,
                          }
                        : l,
                    ),
                  }
                : c,
            ),
          },
        },
      }),
      homeKey,
      null,
    );
    set({ modal: null, editInhalerId: null, inhalerForm: { ...DEFAULT_INHALER_FORM, date: today() } });
  },

  deleteInhaler: async (id, homeKey, catId, uid) => {
    const { doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId ? { ...c, inhalerLogs: c.inhalerLogs.filter((l) => l.id !== id) } : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
  },

  saveInhalerInfo: async (homeKey, catId, uid) => {
    const { inhalerInfoForm, doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId ? { ...c, inhalerInfo: { ...inhalerInfoForm } } : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
  },

  saveProfiles: async (profiles, homeKey, uid) => {
    const { doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: { ...d.households[homeKey], profiles },
        },
      }),
      homeKey,
      uid,
    );
    set({ showMgr: false });
  },

  saveCatInfo: async (catInfo, homeKey, catId, uid) => {
    const { doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId ? { ...c, ...catInfo } : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
  },

  saveMedications: async (meds, homeKey, catId, uid) => {
    const { doSave } = get();
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: d.households[homeKey].cats.map((c) =>
              c.id === catId ? { ...c, medications: meds } : c,
            ),
          },
        },
      }),
      homeKey,
      uid,
    );
  },

  addCat: async (name, homeKey, uid) => {
    const { doSave, data } = get();
    const id = `c${Date.now().toString(36).slice(-5)}`;
    const idx = data?.households?.[homeKey]?.cats?.length || 0;
    await doSave(
      (d) => ({
        ...d,
        households: {
          ...d.households,
          [homeKey]: {
            ...d.households[homeKey],
            cats: [...d.households[homeKey].cats, mkCat(idx, name, { id, name })],
          },
        },
      }),
      homeKey,
      uid,
    );
    return id;
  },

  // ─── Household management ─────────────────────────────────────────────────

  handleHouseholdAction: async (payload, user, deviceId, userHomes, addUserHome) => {
    const memberUid = user?.uid || mkId();
    const profile = {
      id: user?.uid || memberUid,
      name: user?.displayName || user?.email?.split('@')[0] || 'User',
      emoji: '🧑',
      color: PCOLS[0],
    };

    const attachMember = (home: Household): Household => {
      const profiles = Array.isArray(home.profiles) ? home.profiles : [];
      const members = Array.isArray(home.members) ? home.members : [];
      const memberKeys = home.memberKeys || {};
      const nextMembers = members.includes(memberUid) ? members : [...members, memberUid];
      return {
        ...home,
        profiles: profiles.some((p) => p.id === profile.id) ? profiles : [...profiles, profile],
        members: nextMembers,
        memberKeys: { ...memberKeys, [memberUid]: true },
      };
    };

    const linkUserHome = async (id: string, name: string) => {
      if (FB_ON && user?.uid && fbSaveUserMeta) {
        const nextHomes = [...new Set([...(userHomes || []), id])];
        const householdsByKey = nextHomes.reduce((acc: Record<string, true>, h) => { acc[h] = true; return acc; }, {});
        await fbSaveUserMeta(user.uid, { households: householdsByKey });
      }
      addUserHome(id, name);
    };

    if (payload.action === 'open') {
      const key = payload.householdId!;
      if (FB_ON && fbLoad) {
        try {
          const probe = await fbLoad(key);
          if (!probe) return { ok: false, reason: 'not-found' };
          const normalized = normalizeData({ households: { [key]: probe } });
          set({ data: normalized, _dataRef: normalized });
        } catch (err) {
          return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
        }
      }
      await setDeviceHome(deviceId, key);
      return { ok: true, householdId: key };
    }

    if (payload.action === 'create') {
      const householdId = mkHouseholdId();
      const householdName = payload.householdName || 'Home';
      const base = attachMember(
        mkHousehold(householdName, {
          name: householdName,
          cats: [],
          profiles: undefined,
          members: [memberUid],
        }),
      );

      try {
        await linkUserHome(householdId, householdName);
      } catch (err) {
        return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
      }

      if (FB_ON && fbSave) {
        try {
          await fbSave(householdId, base);
        } catch (err) {
          return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
        }
      }

      const normalized = normalizeData({ households: { [householdId]: base } });
      set({ data: normalized, _dataRef: normalized });
      await setDeviceHome(deviceId, householdId);
      return { ok: true, householdId };
    }

    if (payload.action === 'join') {
      const code = (payload.inviteCode || '').toUpperCase();
      if (!code) return { ok: false, reason: 'invalid-invite' };

      let targetId: string | null = null;

      if (FB_ON && fbRedeemInvite && user?.uid) {
        let red;
        try {
          red = await fbRedeemInvite({ code, uid: user.uid });
        } catch (err) {
          return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
        }
        if (!red.ok) return { ok: false, reason: red.reason };
        targetId = red.householdId || null;
      } else {
        const { _dataRef } = get();
        const homesLocal = _dataRef?.households || {};
        targetId = Object.keys(homesLocal).find((h) => homesLocal[h]?.inviteCode === code) || null;
        if (!targetId) return { ok: false, reason: 'not-found' };
      }

      if (!targetId) return { ok: false, reason: 'not-found' };

      try {
        await linkUserHome(targetId, targetId);
      } catch (err) {
        return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
      }

      let remoteHome: Household | null = null;
      if (FB_ON && fbLoad) {
        try {
          remoteHome = await fbLoad(targetId);
        } catch (err) {
          return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
        }
      }

      if (!remoteHome) return { ok: false, reason: 'not-found' };

      const normalized = normalizeData({ households: { [targetId]: remoteHome } });
      const home = normalized.households?.[targetId];
      if (!home) return { ok: false, reason: 'not-found' };

      const updatedHome = attachMember(home);
      if (FB_ON && fbSave) {
        try {
          await fbSave(targetId, updatedHome);
        } catch (err) {
          return { ok: false, reason: isPermissionErr(err) ? 'permission' : 'unknown' };
        }
      }

      const finalNormalized = normalizeData({ households: { [targetId]: updatedHome } });
      set({ data: finalNormalized, _dataRef: finalNormalized });
      await setDeviceHome(deviceId, targetId);
      return { ok: true, householdId: targetId };
    }

    return { ok: false, reason: 'unknown' };
  },

  createInviteCode: async (homeKey, uid) => {
    if (!homeKey) return null;
    const code = mkInviteCode();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (FB_ON && fbCreateInvite && uid) {
      await fbCreateInvite({ code, householdId: homeKey, createdBy: uid, createdAt: Date.now(), expiresAt });
    } else {
      const { doSave } = get();
      await doSave(
        (d) => ({
          ...d,
          households: {
            ...d.households,
            [homeKey]: { ...d.households[homeKey], inviteCode: code },
          },
        }),
        homeKey,
        uid,
      );
    }
    return code;
  },
}));
