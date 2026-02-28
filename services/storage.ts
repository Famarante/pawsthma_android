import AsyncStorage from '@react-native-async-storage/async-storage';

const LS = 'pawsthma_v3';
const DEV_ID_KEY = 'pawsthma_device_id';
const DEV_HOME_MAP = 'pawsthma_device_households';

// ─── App data ────────────────────────────────────────────────────────────────

export const lsLoad = async (): Promise<Record<string, unknown> | null> => {
  try {
    const v = await AsyncStorage.getItem(LS);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

export const lsSave = async (d: unknown): Promise<void> => {
  try {
    await AsyncStorage.setItem(LS, JSON.stringify(d));
  } catch {}
};

// ─── Device ID ───────────────────────────────────────────────────────────────

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let id = await AsyncStorage.getItem(DEV_ID_KEY);
    if (!id) {
      id =
        (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
        `dev_${Math.random().toString(36).slice(2, 12)}`;
      await AsyncStorage.setItem(DEV_ID_KEY, id);
    }
    return id;
  } catch {
    return 'device_fallback';
  }
};

// ─── Device home map ─────────────────────────────────────────────────────────

const loadDeviceHomes = async (): Promise<Record<string, string>> => {
  try {
    const raw = await AsyncStorage.getItem(DEV_HOME_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getDeviceHome = async (deviceId: string): Promise<string | null> => {
  const map = await loadDeviceHomes();
  return map[deviceId] || null;
};

export const setDeviceHome = async (deviceId: string, homeKey: string): Promise<void> => {
  try {
    const map = await loadDeviceHomes();
    map[deviceId] = homeKey;
    await AsyncStorage.setItem(DEV_HOME_MAP, JSON.stringify(map));
  } catch {}
};

export const clearDeviceHome = async (deviceId: string): Promise<void> => {
  try {
    const map = await loadDeviceHomes();
    delete map[deviceId];
    await AsyncStorage.setItem(DEV_HOME_MAP, JSON.stringify(map));
  } catch {}
};

// ─── Language preference ─────────────────────────────────────────────────────

const LANG_KEY = 'pawsthma_lang';

export const loadLang = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
};

export const saveLang = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch {}
};
