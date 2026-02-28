import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useAppStore, HouseholdActionResult } from '../stores/appStore';
import { G } from '../constants/colors';
import { LangToggle } from '../components/LangToggle';

type Mode = 'open' | 'create' | 'join';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);
  const userHomes = useAuthStore((s) => s.userHomes);
  const homeNames = useAuthStore((s) => s.homeNames);
  const deviceId = useAuthStore((s) => s.deviceId);
  const setActiveHome = useAuthStore((s) => s.setActiveHome);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const setUserHomes = useAuthStore((s) => s.setUserHomes);
  const setHomeNames = useAuthStore((s) => s.setHomeNames);
  const handleHouseholdAction = useAppStore((s) => s.handleHouseholdAction);

  const options = userHomes.map((id) => ({ id, label: homeNames[id] || id }));
  const hasSaved = options.length > 0;

  const [mode, setMode] = useState<Mode>(hasSaved ? 'open' : 'create');
  const [householdName, setHouseholdName] = useState('');
  const [selectedId, setSelectedId] = useState(options[0]?.id || '');
  const [inviteCode, setInviteCode] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSaved && mode === 'open') setMode('create');
  }, [hasSaved]);

  const addUserHome = (id: string, name: string) => {
    setUserHomes([...new Set([...userHomes, id])]);
    setHomeNames({ ...homeNames, [id]: name });
  };

  const submit = async () => {
    let payload: Parameters<typeof handleHouseholdAction>[0];

    if (mode === 'open') {
      if (!selectedId) { setErr(t('loginNeedHousehold')); return; }
      payload = { action: 'open', householdId: selectedId };
    } else if (mode === 'create') {
      if (!householdName.trim()) { setErr(t('loginNeedHousehold')); return; }
      payload = { action: 'create', householdName: householdName.trim() };
    } else {
      if (!inviteCode.trim()) { setErr(t('loginNeedInvite')); return; }
      payload = { action: 'join', inviteCode: inviteCode.trim().toUpperCase() };
    }

    const res = await handleHouseholdAction(
      payload,
      user,
      deviceId,
      userHomes,
      addUserHome,
    );

    if (!res.ok) {
      const msgs: Record<string, string> = {
        'not-found': t('inviteInvalid'),
        'invalid-invite': t('inviteInvalid'),
        used: t('inviteUsed'),
        expired: t('inviteExpired'),
        permission: t('householdAccessDenied'),
      };
      setErr(msgs[res.reason || ''] || t('authError'));
      return;
    }

    setAuthed(true);
    setActiveHome(res.householdId || null);
    router.replace('/');
  };

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <LangToggle lang={lang} setLang={setLang} />
      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>{t('loginEnter')}</Text>
        {user?.email && (
          <Text style={styles.sub}>{t('signedInAs', { u: user.email })}</Text>
        )}
        <Text style={styles.sub}>{t('loginSub')}</Text>

        {/* Mode tabs */}
        <View style={styles.tabs}>
          {hasSaved && (
            <TouchableOpacity
              style={[styles.tab, mode === 'open' && styles.tabActive]}
              onPress={() => { setMode('open'); setErr(null); }}
            >
              <Text style={[styles.tabText, mode === 'open' && styles.tabTextActive]}>
                {t('chooseHousehold')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tab, mode === 'create' && styles.tabActive]}
            onPress={() => { setMode('create'); setErr(null); }}
          >
            <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
              {t('addHousehold')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'join' && styles.tabActive]}
            onPress={() => { setMode('join'); setErr(null); }}
          >
            <Text style={[styles.tabText, mode === 'join' && styles.tabTextActive]}>
              {t('joinWithInvite')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Open */}
        {mode === 'open' && hasSaved && (
          <View style={{ marginBottom: 12 }}>
            {options.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.homeRow, selectedId === o.id && styles.homeRowActive]}
                onPress={() => { setSelectedId(o.id); setErr(null); }}
              >
                <Text style={[styles.homeLabel, selectedId === o.id && styles.homeLabelActive]}>
                  🏠 {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Create */}
        {mode === 'create' && (
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={householdName}
            onChangeText={(v) => { setHouseholdName(v); setErr(null); }}
            placeholder={t('householdName')}
            placeholderTextColor={G.muted}
          />
        )}

        {/* Join */}
        {mode === 'join' && (
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={inviteCode}
            onChangeText={(v) => { setInviteCode(v); setErr(null); }}
            placeholder={t('inviteHint')}
            placeholderTextColor={G.muted}
            autoCapitalize="characters"
          />
        )}

        {err && <Text style={styles.err}>{err}</Text>}

        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>
            {mode === 'join' ? t('joinWithInvite') : mode === 'create' ? t('loginCreate') : t('login')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 22,
    padding: 20,
  },
  icon: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { color: G.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  sub: { color: G.muted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: `${G.amber}33` },
  tabText: { color: G.muted, fontSize: 11, textAlign: 'center' },
  tabTextActive: { color: G.amber },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 12,
  },
  homeRow: {
    width: '100%',
    padding: '11px 12px' as any,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: G.border,
    backgroundColor: 'transparent',
  },
  homeRowActive: { borderColor: G.amber, backgroundColor: `${G.amber}1f` },
  homeLabel: { color: G.text, fontWeight: '600' },
  homeLabelActive: { color: G.amber },
  err: { color: G.coral, fontSize: 12, marginBottom: 12 },
  btn: { backgroundColor: G.amber, borderRadius: 14, padding: 13, alignItems: 'center' },
  btnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 16 },
});
