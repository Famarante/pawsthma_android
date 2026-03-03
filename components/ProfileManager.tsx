import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useHousehold } from '../hooks/useHousehold';
import { G, PCOLS, EMOJIS, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { mkId } from '../utils/data';
import { Profile } from '../types';

export function ProfileManager() {
  const { t } = useTranslation();
  const showMgr = useAppStore((s) => s.showMgr);
  const setShowMgr = useAppStore((s) => s.setShowMgr);
  const saveProfiles = useAppStore((s) => s.saveProfiles);
  const uid = useAuthStore((s) => s.uid);
  const { homeKey, profiles } = useHousehold();

  const [local, setLocal] = useState<Profile[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const onOpen = () => {
    setLocal(profiles.map((p) => ({ ...p })));
    setErr(null);
  };

  const upd = (id: string, k: keyof Profile, v: string) => {
    setLocal((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
    setErr(null);
  };

  const rem = (id: string) => {
    if (local.length > 1) setLocal((ps) => ps.filter((p) => p.id !== id));
  };

  const add = () => {
    if (local.length < 8) {
      setLocal((ps) => [
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

  const save = async () => {
    if (local.some((p) => !p.name.trim())) { setErr(t('nameRequired')); return; }
    if (!homeKey) return;
    await saveProfiles(local.map((p) => ({ ...p, name: p.name.trim() })), homeKey, uid);
  };

  return (
    <Modal
      isVisible={showMgr}
      onBackdropPress={() => setShowMgr(false)}
      onModalShow={onOpen}
      style={styles.modal}
      backdropOpacity={0.35}
    >
      <View style={styles.sheet}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('editProfiles')}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMgr(false)}>
              <MaterialIcons name="close" size={20} color={G.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            {local.map((p) => (
              <View key={p.id} style={[styles.profileRow, SHADOWS.card]}>
                <View style={[styles.emojiBtn, { backgroundColor: `${p.color}12`, borderColor: `${p.color}35` }]}>
                  <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                </View>
                <TextInput
                  style={[styles.nameInput, { borderColor: p.name ? `${p.color}50` : G.border }]}
                  value={p.name}
                  onChangeText={(v) => upd(p.id, 'name', v)}
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor={G.muted}
                  maxLength={20}
                />
                {local.length > 1 && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => rem(p.id)}>
                    <MaterialIcons name="close" size={14} color={G.coral} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {local.length < 8 && (
              <TouchableOpacity style={styles.addBtn} onPress={add}>
                <MaterialIcons name="add" size={16} color={G.muted} />
                <Text style={styles.addBtnText}>{t('addPerson')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity style={[styles.doneBtn, SHADOWS.mint]} onPress={save}>
            <Text style={styles.doneBtnText}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.dim },
  content: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: G.text, fontSize: 19, fontFamily: FONTS.bold },
  closeBtn: {
    backgroundColor: G.surface,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  removeBtn: {
    backgroundColor: 'rgba(255,107,107,0.06)',
    borderRadius: 10,
    padding: 6,
  },
  addBtn: {
    padding: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: G.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: { color: G.muted, fontSize: 12, fontFamily: FONTS.medium },
  err: { color: G.coral, fontSize: 12, fontFamily: FONTS.medium, marginBottom: 10, textAlign: 'center' },
  doneBtn: {
    backgroundColor: G.mint,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 15 },
});
