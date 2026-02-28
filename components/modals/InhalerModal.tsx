import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G } from '../../constants/colors';
import { today } from '../../utils/data';

export function InhalerModal() {
  const { t } = useTranslation();
  const modal = useAppStore((s) => s.modal);
  const setModal = useAppStore((s) => s.setModal);
  const inhalerForm = useAppStore((s) => s.inhalerForm);
  const setInhalerForm = useAppStore((s) => s.setInhalerForm);
  const editInhalerId = useAppStore((s) => s.editInhalerId);
  const setEditInhalerId = useAppStore((s) => s.setEditInhalerId);
  const addInhaler = useAppStore((s) => s.addInhaler);
  const saveEditedInhaler = useAppStore((s) => s.saveEditedInhaler);
  const uid = useAuthStore((s) => s.uid);
  const { homeKey, catId } = useHousehold();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEdit = modal === 'editInhaler';
  const visible = modal === 'inhaler' || modal === 'editInhaler';

  const close = () => {
    setModal(null);
    setEditInhalerId(null);
    setInhalerForm({ date: today(), breaths: 2, dosage: '110mcg' });
  };

  const save = async () => {
    if (!homeKey || !catId) return;
    if (isEdit) {
      await saveEditedInhaler(homeKey, catId);
    } else {
      await addInhaler(homeKey, catId, uid);
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
          <Text style={styles.title}>{t('inhalerModal')}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <Text style={{ color: G.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Date */}
          <Text style={styles.label}>{t('date')}</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: G.text }}>{inhalerForm.date}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(inhalerForm.date + 'T12:00:00')}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) {
                  setInhalerForm({ date: d.toISOString().split('T')[0] });
                }
              }}
            />
          )}

          {/* Breaths */}
          <Text style={[styles.label, { marginTop: 16 }]}>{t('numBreaths')}</Text>
          <View style={styles.breathsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.breathBtn,
                  inhalerForm.breaths === n && styles.breathBtnActive,
                ]}
                onPress={() => setInhalerForm({ breaths: n })}
              >
                <Text style={[styles.breathNum, inhalerForm.breaths === n && { color: G.mint }]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={String(inhalerForm.breaths)}
            onChangeText={(v) =>
              setInhalerForm({ breaths: Math.max(1, Number(v) || 1) })
            }
            keyboardType="numeric"
            placeholder={t('numBreaths')}
            placeholderTextColor={G.muted}
          />

          {/* Dosage */}
          <Text style={[styles.label, { marginTop: 16 }]}>{t('dosage')}</Text>
          <TextInput
            style={[styles.input, { marginBottom: 16 }]}
            value={inhalerForm.dosage}
            onChangeText={(v) => setInhalerForm({ dosage: v })}
            placeholder={t('dosageP')}
            placeholderTextColor={G.muted}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>
              {isEdit ? `${t('edit')} ${t('inhalerLog')}` : t('saveInhaler')}
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
    maxHeight: '80%',
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
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 12,
  },
  breathsRow: { flexDirection: 'row', gap: 8 },
  breathBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  breathBtnActive: { borderColor: G.mint, backgroundColor: 'rgba(78,205,196,0.15)' },
  breathNum: { color: G.muted, fontSize: 16, fontWeight: '700' },
  saveBtn: {
    backgroundColor: G.mint,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: G.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 15 },
});
