import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV } from '../../constants/colors';
import { today } from '../../utils/data';

export function AttackModal() {
  const { t } = useTranslation();
  const modal = useAppStore((s) => s.modal);
  const setModal = useAppStore((s) => s.setModal);
  const attackForm = useAppStore((s) => s.attackForm);
  const setAttackForm = useAppStore((s) => s.setAttackForm);
  const editAttackId = useAppStore((s) => s.editAttackId);
  const setEditAttackId = useAppStore((s) => s.setEditAttackId);
  const addAttack = useAppStore((s) => s.addAttack);
  const saveEditedAttack = useAppStore((s) => s.saveEditedAttack);
  const uid = useAuthStore((s) => s.uid);
  const { homeKey, catId: catIdVal } = useHousehold();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEdit = modal === 'editAttack';
  const visible = modal === 'attack' || modal === 'editAttack';

  const close = () => {
    setModal(null);
    setEditAttackId(null);
    setAttackForm({ date: today(), severity: 'mild', durationMin: '', durationSec: '0', notes: '' });
  };

  const save = async () => {
    if (!homeKey || !catIdVal) return;
    if (isEdit) {
      await saveEditedAttack(homeKey, catIdVal, uid);
    } else {
      await addAttack(homeKey, catIdVal, uid);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={close}
      style={styles.modal}
      backdropOpacity={0.65}
      avoidKeyboard
    >
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('attackModal')}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <Text style={{ color: G.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Date */}
          <Text style={styles.label}>{t('date')}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: G.text }}>{attackForm.date}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(attackForm.date + 'T12:00:00')}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) {
                  const iso = d.toISOString().split('T')[0];
                  setAttackForm({ date: iso });
                }
              }}
            />
          )}

          {/* Severity */}
          <Text style={[styles.label, { marginTop: 16 }]}>{t('severity')}</Text>
          <View style={styles.segmented}>
            {(['mild', 'moderate', 'severe'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.segBtn,
                  attackForm.severity === s && { borderColor: SEV[s], backgroundColor: `${SEV[s]}22` },
                ]}
                onPress={() => setAttackForm({ severity: s })}
              >
                <Text style={[styles.segText, attackForm.severity === s && { color: SEV[s] }]}>
                  {t(`sevLabels.${s}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <Text style={[styles.label, { marginTop: 16 }]}>{t('durLabel')}</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Text style={styles.sublabel}>{t('durMinLabel')}</Text>
              <TextInput
                style={styles.input}
                value={attackForm.durationMin}
                onChangeText={(v) => setAttackForm({ durationMin: v })}
                placeholder={t('durP')}
                placeholderTextColor={G.muted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.durationField}>
              <Text style={styles.sublabel}>{t('durSecLabel')}</Text>
              <TextInput
                style={styles.input}
                value={attackForm.durationSec}
                onChangeText={(v) => setAttackForm({ durationSec: v })}
                placeholder={t('durSecP')}
                placeholderTextColor={G.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={[styles.label, { marginTop: 16 }]}>{t('notes')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={attackForm.notes}
            onChangeText={(v) => setAttackForm({ notes: v })}
            placeholder={t('notesP')}
            placeholderTextColor={G.muted}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>
              {isEdit ? `${t('edit')} ${t('attackLog')}` : t('saveAttack')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    padding: 28,
    paddingBottom: 52,
    borderWidth: 1,
    borderColor: G.border,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: G.text, fontSize: 20, fontWeight: '700' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sublabel: { color: G.muted, fontSize: 10, marginBottom: 6 },
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
  textarea: { height: 80, textAlignVertical: 'top', marginBottom: 16 },
  segmented: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  segText: { color: G.muted, fontSize: 11, fontWeight: '600' },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationField: { flex: 1 },
  saveBtn: {
    backgroundColor: G.coral,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: G.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 15 },
});
