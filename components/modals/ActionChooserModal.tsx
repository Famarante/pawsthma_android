import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { G, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export function ActionChooserModal() {
  const { t } = useTranslation();
  const modal = useAppStore((s) => s.modal);
  const setModal = useAppStore((s) => s.setModal);

  const visible = modal === 'chooser';

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={() => setModal(null)}
      onSwipeComplete={() => setModal(null)}
      swipeDirection="down"
      style={styles.modal}
      useNativeDriverForBackdrop
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('fab.chooseAction')}</Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: '#FFF0F0' }]}
          onPress={() => setModal('attack')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
            <MaterialIcons name="warning" size={24} color={G.coral} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: G.coral }]}>{t('recordAttack')}</Text>
            <Text style={styles.optionSub}>{t('logSymptomsTracking')}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={G.coral} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: '#E0F7F6' }]}
          onPress={() => setModal('inhaler')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(78,205,196,0.15)' }]}>
            <MaterialIcons name="medication" size={24} color={G.mint} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: '#2BA89E' }]}>{t('logInhaler')}</Text>
            <Text style={styles.optionSub}>{t('logInhalerSub')}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={G.mint} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: G.dim,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: G.text,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  optionSub: {
    color: G.sub,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    color: G.sub,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
});
