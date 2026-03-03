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
import { G, SHADOWS, GRADIENTS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
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
    return (
      <LinearGradient colors={GRADIENTS.bgSplash} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.langRow}>
            <LangToggle lang={lang} setLang={setLang} compact />
          </View>
          <Text style={styles.title}>{t('chooseCat')}</Text>
          <Text style={styles.sub}>{t('catHistorySub')}</Text>

          {cats.map((c, idx) => (
            <TouchableOpacity key={c.id} style={[styles.catRow, SHADOWS.card]} onPress={() => chooseCat(c.id)}>
              <View style={styles.catLeft}>
                <View style={styles.catIcon}>
                  <MaterialIcons name="pets" size={20} color={G.primary} />
                </View>
                <Text style={styles.catName}>{c.name || `Cat ${idx + 1}`}</Text>
              </View>
              <Text style={styles.catCount}>
                {t('catCount', { count: (c.attacks || []).length })}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={[styles.addSection, SHADOWS.card]}>
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
                style={[styles.addBtn, SHADOWS.mint]}
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
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.bgSplash} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.langRow}>
          <LangToggle lang={lang} setLang={setLang} compact />
        </View>
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardIcon}>
            <MaterialIcons name="pets" size={32} color={G.primary} />
          </View>
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
          <TouchableOpacity style={[styles.saveBtn, SHADOWS.mint]} onPress={save}>
            <Text style={styles.saveBtnText}>{t('saveCat')}</Text>
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
    justifyContent: 'center',
    padding: 16,
  },
  langRow: { position: 'absolute', top: 52, right: 16 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,126,103,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: G.text,
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    color: G.sub,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 22,
  },
  catRow: {
    width: '100%',
    maxWidth: 430,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,126,103,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { color: G.text, fontFamily: FONTS.semiBold, fontSize: 15 },
  catCount: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular },
  addSection: {
    width: '100%',
    maxWidth: 430,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  addLabel: { color: G.sub, fontSize: 13, fontFamily: FONTS.semiBold, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
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
  addBtn: {
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: G.mint,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  addBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold },
  err: { color: G.coral, fontSize: 12, fontFamily: FONTS.medium, marginTop: 8 },
  saveBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: G.mint,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 },
});
