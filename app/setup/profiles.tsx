import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, PCOLS, EMOJIS } from '../../constants/colors';
import { mkId } from '../../utils/data';
import { Profile } from '../../types';
import { LangToggle } from '../../components/LangToggle';

function ProfileRow({
  p,
  onUpdate,
  onRemove,
  canRemove,
}: {
  p: Profile;
  onUpdate: (key: keyof Profile, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <View style={[styles.profileRow, { borderColor: G.border }]}>
      <TouchableOpacity
        style={[styles.emojiBtn, { backgroundColor: `${p.color}18`, borderColor: `${p.color}50` }]}
      >
        <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.nameInput, { borderColor: p.name ? `${p.color}60` : G.border }]}
        value={p.name}
        onChangeText={(v) => onUpdate('name', v)}
        placeholder="Name…"
        placeholderTextColor={G.muted}
        maxLength={20}
      />
      {canRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Text style={{ color: G.coral, fontSize: 13 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ProfilesSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);
  const { homeKey } = useHousehold();
  const uid = useAuthStore((s) => s.uid);
  const saveProfiles = useAppStore((s) => s.saveProfiles);

  const [profiles, setProfiles] = useState<Profile[]>([
    { id: mkId(), name: '', emoji: '👨', color: PCOLS[0] },
    { id: mkId(), name: '', emoji: '👩', color: PCOLS[1] },
  ]);
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    if (profiles.length < 8) {
      setProfiles((ps) => [
        ...ps,
        {
          id: mkId(),
          name: '',
          emoji: EMOJIS[ps.length % EMOJIS.length],
          color: PCOLS[ps.length % PCOLS.length],
        },
      ]);
    }
  };

  const upd = (id: string, k: keyof Profile, v: string) => {
    setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
    setErr(null);
  };

  const rem = (id: string) => setProfiles((ps) => ps.filter((p) => p.id !== id));

  const save = async () => {
    if (!profiles.length) { setErr(t('minProfiles')); return; }
    if (profiles.some((p) => !p.name.trim())) { setErr(t('nameRequired')); return; }
    if (!homeKey) return;
    await saveProfiles(profiles.map((p) => ({ ...p, name: p.name.trim() })), homeKey, uid);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <LangToggle lang={lang} setLang={setLang} />
      <Text style={{ fontSize: 44, marginBottom: 10 }}>🐱</Text>
      <Text style={styles.title}>{t('setupTitle')}</Text>
      <Text style={styles.sub}>{t('setupSub')}</Text>

      <View style={{ width: '100%', maxWidth: 420 }}>
        {profiles.map((p) => (
          <ProfileRow
            key={p.id}
            p={p}
            onUpdate={(k, v) => upd(p.id, k, v)}
            onRemove={() => rem(p.id)}
            canRemove={profiles.length > 1}
          />
        ))}

        {profiles.length < 8 && (
          <TouchableOpacity style={styles.addBtn} onPress={add}>
            <Text style={{ color: G.muted, fontSize: 13 }}>{t('addPerson')}</Text>
          </TouchableOpacity>
        )}

        {err && <Text style={styles.err}>{err}</Text>}

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>{t('letsGo')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    color: G.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    color: G.muted,
    fontSize: 13,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  profileRow: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 10,
  },
  removeBtn: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: 10,
    padding: 8,
  },
  addBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: G.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 20,
  },
  err: { color: G.coral, fontSize: 12, marginBottom: 12, textAlign: 'center' },
  saveBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 16,
    backgroundColor: G.amber,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 16 },
});
