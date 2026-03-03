import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
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
  const { homeKey, catId, currentCat } = useHousehold();

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

  const dosageName = currentCat?.inhalerInfo?.dosage || inhalerForm.dosage;

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
              <Text style={styles.title}>{t('logInhaler')}</Text>
              <Text style={styles.subtitle}>{isEdit ? t('edit') : t('logInhalerSub')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={close}>
              <MaterialIcons name="close" size={20} color={G.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Medication card */}
            <View style={styles.medCard}>
              <View style={styles.medIcon}>
                <MaterialIcons name="medication" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.medLabel}>MEDICATION</Text>
                <Text style={styles.medName}>{dosageName}</Text>
              </View>
            </View>

            {/* Breaths Taken */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="air" size={18} color={G.mint} />
              </View>
              <Text style={styles.sectionLabel}>{t('breathsTaken')}</Text>
            </View>

            <Text style={styles.breathsNumber}>{inhalerForm.breaths}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.breathsScroll}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const active = inhalerForm.breaths === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.breathCircle, active && styles.breathCircleActive]}
                    onPress={() => setInhalerForm({ breaths: n })}
                  >
                    <Text style={[styles.breathCircleText, active && styles.breathCircleTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Notes */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={[styles.sectionIcon, { backgroundColor: 'rgba(78,205,196,0.08)' }]}>
                <MaterialIcons name="edit" size={16} color={G.mint} />
              </View>
              <Text style={styles.sectionLabel}>{t('notesOptional')}</Text>
            </View>
            <TextInput
              style={styles.textarea}
              value={inhalerForm.dosage !== dosageName ? '' : ''}
              placeholder={t('notesP')}
              placeholderTextColor={G.muted}
              multiline
              numberOfLines={3}
            />

            {/* Save */}
            <TouchableOpacity style={[styles.saveBtn, SHADOWS.mint]} onPress={save}>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isEdit ? `${t('edit')} ${t('inhalerLog')}` : t('saveLog')}
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

  // Medication card
  medCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medLabel: {
    color: '#3B82F6',
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  medName: { color: G.text, fontSize: 15, fontFamily: FONTS.bold, marginTop: 2 },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(78,205,196,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { color: G.text, fontSize: 14, fontFamily: FONTS.semiBold },

  // Breaths
  breathsNumber: {
    color: G.mint,
    fontSize: 48,
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
    marginBottom: 16,
  },
  breathsScroll: {
    paddingHorizontal: 4,
    gap: 10,
    marginBottom: 8,
  },
  breathCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathCircleActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: G.mint,
    ...SHADOWS.mint,
  },
  breathCircleText: { color: G.sub, fontSize: 16, fontFamily: FONTS.bold },
  breathCircleTextActive: { color: '#FFFFFF', fontSize: 18, fontFamily: FONTS.extraBold },

  // Notes
  textarea: {
    backgroundColor: '#F3F0EF',
    borderRadius: 14,
    color: G.text,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
    paddingHorizontal: 16,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 24,
  },

  // Save
  saveBtn: {
    backgroundColor: G.mint,
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
