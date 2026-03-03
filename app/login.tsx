import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useAppStore, HouseholdActionResult } from '../stores/appStore';
import { G, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
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

  const tabs: { key: Mode; label: string }[] = [
    ...(hasSaved ? [{ key: 'open' as Mode, label: t('chooseHousehold') }] : []),
    { key: 'create', label: t('addHousehold') },
    { key: 'join', label: t('joinWithInvite') },
  ];

  return (
    <LinearGradient colors={GRADIENTS.bgSplash} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.langRow}>
          <LangToggle lang={lang} setLang={setLang} compact />
        </View>

        <View style={styles.logoMoment}>
          <View style={[styles.logoCircle, SHADOWS.primary]}>
            <MaterialIcons name="pets" size={28} color={G.primary} />
          </View>
          <Text style={styles.wordmark}>Pawsthma</Text>
          <Text style={styles.tagline}>{t('sub')}</Text>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.title}>{t('loginEnter')}</Text>
          {user?.email && (
            <Text style={styles.sub}>{t('signedInAs', { u: user.email })}</Text>
          )}
          <Text style={styles.sub}>{t('loginSub')}</Text>

          <View style={styles.segControl}>
            {tabs.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.segTab, mode === key && styles.segTabActive]}
                onPress={() => { setMode(key); setErr(null); }}
              >
                <Text style={[styles.segTabText, mode === key && styles.segTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'open' && hasSaved && (
            <View style={{ marginBottom: 12 }}>
              {options.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.homeRow, selectedId === o.id && styles.homeRowActive]}
                  onPress={() => { setSelectedId(o.id); setErr(null); }}
                >
                  <MaterialIcons
                    name="home"
                    size={18}
                    color={selectedId === o.id ? G.primary : G.muted}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.homeLabel, selectedId === o.id && styles.homeLabelActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mode === 'create' && (
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={householdName}
              onChangeText={(v) => { setHouseholdName(v); setErr(null); }}
              placeholder={t('householdName')}
              placeholderTextColor={G.muted}
            />
          )}

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

          <TouchableOpacity style={[styles.btn, SHADOWS.primary]} onPress={submit}>
            <Text style={styles.btnText}>
              {mode === 'join' ? t('joinWithInvite') : mode === 'create' ? t('loginCreate') : t('login')}
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  langRow: { position: 'absolute', top: 52, right: 16 },
  logoMoment: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  wordmark: {
    color: G.text,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: { color: G.muted, fontSize: 13, fontFamily: FONTS.regular },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  title: { color: G.text, fontSize: 20, fontFamily: FONTS.bold, textAlign: 'center', marginBottom: 4 },
  sub: { color: G.muted, fontSize: 12, fontFamily: FONTS.regular, textAlign: 'center', marginBottom: 8 },
  segControl: {
    flexDirection: 'row',
    backgroundColor: G.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    gap: 2,
  },
  segTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segTabActive: {
    backgroundColor: G.primary,
    ...SHADOWS.primary,
  },
  segTabText: { color: G.muted, fontSize: 11, fontFamily: FONTS.semiBold, textAlign: 'center' },
  segTabTextActive: { color: '#FFFFFF', fontFamily: FONTS.bold },
  input: {
    backgroundColor: G.bgInput,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 14,
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  homeRow: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: G.border,
    backgroundColor: G.bgInput,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeRowActive: { borderColor: G.primary, backgroundColor: 'rgba(255,126,103,0.06)' },
  homeLabel: { color: G.text, fontFamily: FONTS.semiBold },
  homeLabelActive: { color: G.primary },
  err: { color: G.coral, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 12 },
  btn: {
    backgroundColor: G.primary,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 },
});
