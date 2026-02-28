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
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useHousehold } from '../hooks/useHousehold';
import { G, PCOLS, EMOJIS } from '../constants/colors';
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

  // Reset local state when opened
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
      backdropOpacity={0.7}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('editProfiles')}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowMgr(false)}>
            <Text style={{ color: G.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 400 }}>
          {local.map((p) => (
            <View key={p.id} style={styles.profileRow}>
              <View style={[styles.emojiBtn, { backgroundColor: `${p.color}18`, borderColor: `${p.color}50` }]}>
                <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
              </View>
              <TextInput
                style={[styles.nameInput, { borderColor: p.name ? `${p.color}60` : G.border }]}
                value={p.name}
                onChangeText={(v) => upd(p.id, 'name', v)}
                placeholder={t('namePlaceholder')}
                placeholderTextColor={G.muted}
                maxLength={20}
              />
              {local.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => rem(p.id)}>
                  <Text style={{ color: G.coral, fontSize: 13 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {local.length < 8 && (
            <TouchableOpacity style={styles.addBtn} onPress={add}>
              <Text style={{ color: G.muted, fontSize: 12 }}>{t('addPerson')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {err && <Text style={styles.err}>{err}</Text>}

        <TouchableOpacity style={styles.doneBtn} onPress={save}>
          <Text style={styles.doneBtnText}>{t('done')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: '#121827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: G.border,
    borderBottomWidth: 0,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: G.text, fontSize: 19, fontWeight: '700' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 16,
    padding: 12,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderRadius: 12,
    color: G.text,
    fontSize: 14,
    padding: 10,
  },
  removeBtn: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: 10,
    padding: 6,
  },
  addBtn: {
    padding: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: G.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  err: { color: G.coral, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  doneBtn: {
    backgroundColor: G.mint,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 15 },
});
