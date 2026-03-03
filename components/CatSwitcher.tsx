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
import { G, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

export function CatSwitcher() {
  const { t } = useTranslation();
  const showCatSwitcher = useAppStore((s) => s.showCatSwitcher);
  const setShowCatSwitcher = useAppStore((s) => s.setShowCatSwitcher);
  const setCatId = useAppStore((s) => s.setCatId);
  const addCat = useAppStore((s) => s.addCat);
  const uid = useAuthStore((s) => s.uid);
  const { homeKey, cats, catId } = useHousehold();

  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const onClose = () => {
    setShowCatSwitcher(false);
    setShowAdd(false);
    setNewName('');
  };

  const selectCat = (id: string) => {
    setCatId(id);
    onClose();
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name || !homeKey) return;
    const id = await addCat(name, homeKey, uid);
    setCatId(id);
    onClose();
  };

  return (
    <Modal
      isVisible={showCatSwitcher}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.35}
    >
      <View style={styles.sheet}>
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('switchCat')}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={20} color={G.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            {cats.map((cat) => {
              const isActive = cat.id === catId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    SHADOWS.card,
                    isActive && styles.catCardActive,
                  ]}
                  onPress={() => selectCat(cat.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.catIcon,
                      isActive && styles.catIconActive,
                    ]}
                  >
                    <MaterialIcons
                      name="pets"
                      size={22}
                      color={isActive ? '#FFFFFF' : G.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catSub}>
                      {t('catCount', { count: cat.attacks.length })}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={22} color={G.mint} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add new cat area */}
            {showAdd ? (
              <View style={styles.addArea}>
                <TextInput
                  style={styles.addInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t('catName')}
                  placeholderTextColor={G.muted}
                  maxLength={30}
                  autoFocus
                />
                <View style={styles.addActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setShowAdd(false); setNewName(''); }}
                  >
                    <Text style={styles.cancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, !newName.trim() && { opacity: 0.5 }]}
                    onPress={handleAdd}
                    disabled={!newName.trim()}
                  >
                    <Text style={styles.confirmText}>{t('add')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAdd(true)}
              >
                <MaterialIcons name="add" size={16} color={G.primary} />
                <Text style={styles.addBtnText}>{t('addNewCat')}</Text>
              </TouchableOpacity>
            )}
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: G.dim },
  content: { padding: 24, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: G.text, fontSize: 19, fontFamily: FONTS.bold },
  closeBtn: {
    backgroundColor: G.surface,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catCardActive: {
    borderColor: G.mint,
    backgroundColor: 'rgba(78,205,196,0.04)',
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,126,103,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconActive: {
    backgroundColor: G.mint,
  },
  catName: { color: G.text, fontSize: 15, fontFamily: FONTS.bold },
  catSub: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  addBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: G.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: { color: G.primary, fontSize: 13, fontFamily: FONTS.semiBold },
  addArea: {
    backgroundColor: G.bgInput,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    gap: 12,
  },
  addInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: G.border,
    borderRadius: 14,
    color: G.text,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelText: { color: G.sub, fontSize: 14, fontFamily: FONTS.medium },
  confirmBtn: {
    backgroundColor: G.mint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  confirmText: { color: '#FFFFFF', fontSize: 14, fontFamily: FONTS.bold },
});
