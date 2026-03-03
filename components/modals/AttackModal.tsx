import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV_BG, SEV_BORDER, SEV_TEXT, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { today, fmt, parseLocalDate, fmtLocalDateKey } from '../../utils/data';

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
  const lang = useAuthStore((s) => s.lang);
  const { homeKey, catId: catIdVal } = useHousehold();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isEdit = modal === 'editAttack';
  const visible = modal === 'attack' || modal === 'editAttack';

  // Parse date and time parts from the stored date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM)
  const datePart = attackForm.date.split('T')[0] || today();
  const timePart = attackForm.date.includes('T') ? attackForm.date.split('T')[1] : null;

  const nowDatetime = () => {
    const n = new Date();
    return `${fmtLocalDateKey(n)}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  };

  const fmtTime = (timeStr: string): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const datePickerValue = (): Date => {
    const d = parseLocalDate(datePart);
    if (timePart) {
      const [h, m] = timePart.split(':').map(Number);
      d.setHours(h, m);
    }
    return d;
  };

  const close = () => {
    setModal(null);
    setEditAttackId(null);
    setAttackForm({ date: nowDatetime(), severity: 'mild', durationMin: '', durationSec: '0', notes: '' });
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const save = async () => {
    if (!homeKey || !catIdVal) return;
    // Ensure time is always present in the saved date
    if (!attackForm.date.includes('T')) {
      const n = new Date();
      const time = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
      setAttackForm({ date: `${attackForm.date}T${time}` });
    }
    if (isEdit) {
      await saveEditedAttack(homeKey, catIdVal, uid);
    } else {
      await addAttack(homeKey, catIdVal, uid);
    }
  };

  const handleSecChange = (v: string) => {
    const num = Number(v);
    if (v === '') {
      setAttackForm({ durationSec: '' });
    } else if (!isNaN(num) && num >= 0 && num <= 59) {
      setAttackForm({ durationSec: v });
    } else if (!isNaN(num) && num > 59) {
      setAttackForm({ durationSec: '59' });
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={close}
      style={styles.modal}
      backdropOpacity={0.35}
      avoidKeyboard
    >
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('recordAttack')}</Text>
              <Text style={styles.subtitle}>{t('logSymptomsTracking')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close}>
              <MaterialIcons name="close" size={20} color={G.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Date */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="event" size={18} color={G.primary} />
              </View>
              <Text style={styles.sectionLabel}>{t('date')} & {t('time')}</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={[styles.dateRow, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
                <View style={styles.dateLeft}>
                  <MaterialIcons name="calendar-today" size={18} color={G.sub} />
                  <Text style={styles.dateLabel}>{t('date')}</Text>
                </View>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{fmt(datePart, lang)}</Text>
                  <MaterialIcons name="chevron-right" size={18} color={G.primary} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateRow} onPress={() => setShowTimePicker(true)}>
                <View style={styles.dateLeft}>
                  <MaterialIcons name="access-time" size={18} color={G.sub} />
                </View>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>
                    {timePart ? fmtTime(timePart) : fmtTime(`${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={datePickerValue()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) {
                    const time = timePart || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
                    setAttackForm({ date: `${fmtLocalDateKey(d)}T${time}` });
                  }
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={datePickerValue()}
                mode="time"
                display="default"
                onChange={(_, d) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (d) {
                    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    setAttackForm({ date: `${datePart}T${time}` });
                  }
                }}
              />
            )}

            {/* Severity */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="warning-amber" size={18} color={G.primary} />
              </View>
              <Text style={styles.sectionLabel}>{t('severity')}</Text>
            </View>
            <View style={styles.sevRow}>
              {(['mild', 'moderate', 'severe'] as const).map((s) => {
                const active = attackForm.severity === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.sevChip,
                      active
                        ? { backgroundColor: SEV_BG[s], borderColor: SEV_BORDER[s] }
                        : { backgroundColor: '#F3F0EF', borderColor: 'transparent' },
                    ]}
                    onPress={() => setAttackForm({ severity: s })}
                  >
                    <Text style={[
                      styles.sevChipText,
                      { color: active ? SEV_TEXT[s] : G.sub },
                      active && { fontFamily: FONTS.bold },
                    ]}>
                      {t(`sevLabels.${s}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="schedule" size={18} color={G.primary} />
              </View>
              <Text style={styles.sectionLabel}>{t('durLabel')}</Text>
            </View>
            <View style={styles.durationCard}>
              <View style={styles.durationInputRow}>
                <View style={styles.durationCell}>
                  <TextInput
                    style={styles.durationInput}
                    value={attackForm.durationMin}
                    onChangeText={(v) => setAttackForm({ durationMin: v.replace(/[^0-9]/g, '') })}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholder="00"
                    placeholderTextColor={G.dim}
                  />
                  <Text style={styles.durationUnitLabel}>{t('durMinLabel').toUpperCase()}</Text>
                </View>
                <Text style={styles.durationColon}>:</Text>
                <View style={styles.durationCell}>
                  <TextInput
                    style={styles.durationInput}
                    value={attackForm.durationSec}
                    onChangeText={handleSecChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    placeholder="00"
                    placeholderTextColor={G.dim}
                  />
                  <Text style={styles.durationUnitLabel}>{t('durSecLabel').toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="edit-note" size={18} color={G.primary} />
              </View>
              <Text style={styles.sectionLabel}>{t('observationNotes')}</Text>
            </View>
            <TextInput
              style={styles.textarea}
              value={attackForm.notes}
              onChangeText={(v) => setAttackForm({ notes: v })}
              placeholder={t('notesP')}
              placeholderTextColor={G.muted}
              multiline
              numberOfLines={3}
            />

            {/* Save */}
            <TouchableOpacity style={[styles.saveBtn, SHADOWS.primary]} onPress={save}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isEdit ? `${t('edit')} ${t('attackLog')}` : t('saveRecord')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { justifyContent: 'flex-end', margin: 0 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.dim },
  content: { paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: { color: G.text, fontSize: 22, fontFamily: FONTS.extraBold },
  subtitle: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  closeBtn: {
    backgroundColor: G.surface,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,126,103,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { color: G.text, fontSize: 14, fontFamily: FONTS.semiBold },

  // Date & Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F0EF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateLabel: { color: G.sub, fontSize: 14, fontFamily: FONTS.semiBold },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,126,103,0.08)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  datePillText: { color: G.primary, fontSize: 14, fontFamily: FONTS.bold },

  // Severity chips
  sevRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  sevChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  sevChipText: { fontSize: 13, fontFamily: FONTS.semiBold },

  // Duration
  durationCard: {
    backgroundColor: '#F3F0EF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  durationInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
  },
  durationCell: {
    alignItems: 'center',
  },
  durationInput: {
    width: 80,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    color: G.text,
    textAlign: 'center',
  },
  durationColon: {
    fontSize: 32,
    fontFamily: FONTS.extraBold,
    color: G.sub,
    marginTop: 14,
  },
  durationUnitLabel: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: G.muted,
    letterSpacing: 0.5,
    marginTop: 6,
  },

  // Notes
  textarea: {
    backgroundColor: '#F3F0EF',
    borderRadius: 16,
    color: G.text,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 24,
  },

  // Save
  saveBtn: {
    backgroundColor: G.primary,
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 },
});
