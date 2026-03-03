import { useState } from 'react';
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
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, PCOLS, EMOJIS, SHADOWS, GRADIENTS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
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
    <View style={[styles.profileRow, SHADOWS.card]}>
      <TouchableOpacity
        style={[styles.emojiBtn, { backgroundColor: `${p.color}15`, borderColor: `${p.color}40` }]}
      >
        <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.nameInput, { borderColor: p.name ? `${p.color}50` : G.border }]}
        value={p.name}
        onChangeText={(v) => onUpdate('name', v)}
        placeholder="Name..."
        placeholderTextColor={G.muted}
        maxLength={20}
      />
      {canRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <MaterialIcons name="close" size={16} color={G.coral} />
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
    <LinearGradient colors={GRADIENTS.bgSplash} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.langRow}>
          <LangToggle lang={lang} setLang={setLang} compact />
        </View>

        <View style={styles.iconWrap}>
          <MaterialIcons name="pets" size={36} color={G.primary} />
        </View>
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
              <MaterialIcons name="add" size={18} color={G.muted} />
              <Text style={styles.addBtnText}>{t('addPerson')}</Text>
            </TouchableOpacity>
          )}

          {err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity style={[styles.saveBtn, SHADOWS.primary]} onPress={save}>
            <Text style={styles.saveBtnText}>{t('letsGo')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    paddingBottom: 60,
  },
  langRow: { position: 'absolute', top: 52, right: 16 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,126,103,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: G.text,
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    color: G.sub,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  profileRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: G.bgInput,
    borderWidth: 1.5,
    borderRadius: 14,
    color: G.text,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  removeBtn: {
    backgroundColor: 'rgba(255,107,107,0.08)',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: { color: G.muted, fontSize: 13, fontFamily: FONTS.medium },
  err: { color: G.coral, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 12, textAlign: 'center' },
  saveBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: G.primary,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 },
});
