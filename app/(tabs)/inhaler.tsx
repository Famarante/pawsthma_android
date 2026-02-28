import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G } from '../../constants/colors';
import { fmt } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { AttackModal } from '../../components/modals/AttackModal';
import { InhalerModal } from '../../components/modals/InhalerModal';
import { ProfileManager } from '../../components/ProfileManager';
import { WhoBadge } from '../../components/WhoBadge';
import { InhalerLog } from '../../types';

export default function InhalerTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const uid = useAuthStore((s) => s.uid);
  const setModal = useAppStore((s) => s.setModal);
  const setInhalerForm = useAppStore((s) => s.setInhalerForm);
  const setEditInhalerId = useAppStore((s) => s.setEditInhalerId);
  const deleteInhaler = useAppStore((s) => s.deleteInhaler);
  const saveInhalerInfo = useAppStore((s) => s.saveInhalerInfo);
  const inhalerInfoForm = useAppStore((s) => s.inhalerInfoForm);
  const setInhalerInfoForm = useAppStore((s) => s.setInhalerInfoForm);
  const catId = useAppStore((s) => s.catId);
  const { homeKey, inhalerLogs, profiles, currentCat } = useHousehold();

  const [showCleanedPicker, setShowCleanedPicker] = useState(false);

  // Sync inhalerInfoForm from currentCat when it changes
  useEffect(() => {
    if (currentCat?.inhalerInfo) {
      setInhalerInfoForm(currentCat.inhalerInfo);
    }
  }, [currentCat?.id]);

  const sortedDesc = [...inhalerLogs].sort((a, b) => b.date.localeCompare(a.date));

  const handleEdit = (l: InhalerLog) => {
    setInhalerForm({
      date: l.date || '',
      breaths: Math.max(1, Number(l.breaths) || 1),
      dosage: l.dosage || '',
    });
    setEditInhalerId(l.id);
    setModal('editInhaler');
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('del'),
      t('deleteInhalerConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!homeKey || !catId) return;
            await deleteInhaler(id, homeKey, catId, uid);
          },
        },
      ],
    );
  };

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>

        {/* Device settings */}
        <Text style={styles.sectionLabel}>{t('deviceSettings')}</Text>
        <View style={styles.card}>
          {/* Dosage */}
          <Text style={styles.fieldLabel}>{t('dosage')}</Text>
          <TextInput
            style={styles.input}
            value={inhalerInfoForm.dosage}
            onChangeText={(v) => setInhalerInfoForm({ dosage: v })}
            placeholder={t('dosageP')}
            placeholderTextColor={G.muted}
          />

          {/* Last cleaned */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('lastCleaned')}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowCleanedPicker(true)}
          >
            <Text style={{ color: G.text }}>{inhalerInfoForm.lastCleaned}</Text>
          </TouchableOpacity>
          {showCleanedPicker && (
            <DateTimePicker
              value={new Date(inhalerInfoForm.lastCleaned + 'T12:00:00')}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, d) => {
                setShowCleanedPicker(false);
                if (d) {
                  setInhalerInfoForm({ lastCleaned: d.toISOString().split('T')[0] });
                }
              }}
            />
          )}

          {/* Clean every */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('cleanEvery')}</Text>
          <TextInput
            style={styles.input}
            value={String(inhalerInfoForm.cleaningIntervalDays)}
            onChangeText={(v) => setInhalerInfoForm({ cleaningIntervalDays: Number(v) || 14 })}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              if (!homeKey || !catId) return;
              await saveInhalerInfo(homeKey, catId, uid);
            }}
          >
            <Text style={styles.saveBtnText}>{t('saveSettings')}</Text>
          </TouchableOpacity>
        </View>

        {/* Inhaler log */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>{t('inhalerLog')}</Text>
          <Text style={{ color: G.muted, fontSize: 12 }}>{inhalerLogs.length} {t('uses')}</Text>
        </View>

        {sortedDesc.map((l) => (
          <View key={l.id} style={styles.logCard}>
            <View style={styles.logTop}>
              <View>
                <View style={styles.logDateRow}>
                  <Text style={styles.logDate}>{fmt(l.date, lang)}</Text>
                  <WhoBadge addedBy={l.addedBy} profiles={profiles} />
                </View>
                <Text style={styles.logBreaths}>💨 {t('breaths', { count: l.breaths })}</Text>
              </View>
              <View style={styles.logRight}>
                <View style={styles.dosageBadge}>
                  <Text style={styles.dosageText}>{l.dosage}</Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(l)}>
                    <Text style={{ color: G.muted, fontSize: 10 }}>{t('edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(l.id)}>
                    <Text style={{ color: G.coral, fontSize: 10 }}>{t('del')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {!inhalerLogs.length && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 32 }}>💨</Text>
            <Text style={{ color: G.muted, fontSize: 14, marginTop: 8 }}>No inhaler uses recorded yet</Text>
          </View>
        )}
      </ScrollView>

      <AttackModal />
      <InhalerModal />
      <ProfileManager />
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  sectionLabel: { color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', marginBottom: 12 },
  card: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  fieldLabel: { color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 12,
    marginBottom: 4,
  },
  saveBtn: { backgroundColor: G.mint, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  logCard: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderLeftWidth: 3,
    borderLeftColor: G.mint,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  logDate: { color: G.text, fontWeight: '600' },
  logBreaths: { color: G.muted, fontSize: 12, marginTop: 4 },
  logRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  dosageBadge: { backgroundColor: 'rgba(78,205,196,0.1)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  dosageText: { color: G.mint, fontSize: 13, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.33)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
});
