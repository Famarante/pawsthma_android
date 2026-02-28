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
import { G } from '../../constants/colors';
import { LangToggle } from '../../components/LangToggle';

export default function CatSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);
  const uid = useAuthStore((s) => s.uid);
  const { homeKey, cats } = useHousehold();
  const addCat = useAppStore((s) => s.addCat);
  const setCatId = useAppStore((s) => s.setCatId);

  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const isFirstCat = cats.length === 0;

  const save = async () => {
    if (!name.trim()) { setErr(t('firstCatRequired')); return; }
    if (!homeKey) return;
    const id = await addCat(name.trim(), homeKey, uid);
    setCatId(id);
    router.replace('/(tabs)');
  };

  const chooseCat = (id: string) => {
    setCatId(id);
    router.replace('/(tabs)');
  };

  if (!isFirstCat) {
    // CatPicker mode
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
        <LangToggle lang={lang} setLang={setLang} />
        <Text style={styles.title}>{t('chooseCat')}</Text>
        <Text style={styles.sub}>{t('catHistorySub')}</Text>

        {cats.map((c, idx) => (
          <TouchableOpacity key={c.id} style={styles.catRow} onPress={() => chooseCat(c.id)}>
            <View style={styles.catLeft}>
              <Text style={{ fontSize: 22 }}>🐱</Text>
              <Text style={styles.catName}>{c.name || `Cat ${idx + 1}`}</Text>
            </View>
            <Text style={styles.catCount}>
              {t('catCount', { count: (c.attacks || []).length })}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.addSection}>
          <Text style={styles.addLabel}>{t('addNewCat')}</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => { setName(v); setErr(null); }}
              placeholder={t('catName')}
              placeholderTextColor={G.muted}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={async () => {
                if (!name.trim() || !homeKey) return;
                const id = await addCat(name.trim(), homeKey, uid);
                setCatId(id);
                setName('');
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.addBtnText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
          {err && <Text style={styles.err}>{err}</Text>}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <LangToggle lang={lang} setLang={setLang} />
      <View style={styles.card}>
        <Text style={styles.title}>{t('firstCatTitle')}</Text>
        <Text style={styles.sub}>{t('firstCatSub')}</Text>
        <TextInput
          style={[styles.input, { marginBottom: 12 }]}
          value={name}
          onChangeText={(v) => { setName(v); setErr(null); }}
          placeholder={t('catName')}
          placeholderTextColor={G.muted}
        />
        {err && <Text style={styles.err}>{err}</Text>}
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>{t('saveCat')}</Text>
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
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 20,
    padding: 20,
  },
  title: {
    color: G.text,
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    color: G.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  catRow: {
    width: '100%',
    maxWidth: 430,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { color: G.text, fontWeight: '600' },
  catCount: { color: G.muted, fontSize: 12 },
  addSection: {
    width: '100%',
    maxWidth: 430,
    marginTop: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 16,
    backgroundColor: G.surface,
  },
  addLabel: { color: G.muted, fontSize: 12, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 12,
  },
  addBtn: {
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: G.mint,
    justifyContent: 'center',
  },
  addBtnText: { color: '#0a0f1e', fontWeight: '700' },
  err: { color: G.coral, fontSize: 12, marginTop: 8 },
  saveBtn: {
    width: '100%',
    padding: 13,
    borderRadius: 14,
    backgroundColor: G.mint,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 15 },
});
