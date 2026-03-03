import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { useHousehold } from '../hooks/useHousehold';
import { G, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FB_ON } from '../services/firebase';
import { CatSwitcher } from './CatSwitcher';

export function AppHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setShowCatSwitcher = useAppStore((s) => s.setShowCatSwitcher);
  const setCatId = useAppStore((s) => s.setCatId);
  const setModal = useAppStore((s) => s.setModal);

  const { currentCat, me } = useHousehold();

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.row}>
          {/* Profile selector pill */}
          <View style={styles.profilePill}>
            <TouchableOpacity style={styles.catAvatar} onPress={() => router.push('/profile')}>
              {currentCat?.photo ? (
                <Image source={{ uri: currentCat.photo }} style={styles.catAvatarImage} />
              ) : (
                <MaterialIcons name="pets" size={18} color={G.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCatSwitcher(true)} style={styles.nameArea}>
              <View>
                <Text style={styles.catName}>{currentCat?.name || 'Cat'}</Text>
                <Text style={styles.activeLabel}>ACTIVE PROFILE</Text>
              </View>
              <MaterialIcons name="expand-more" size={20} color={G.muted} />
            </TouchableOpacity>
          </View>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellBtn}>
            <MaterialIcons name="notifications-none" size={22} color={G.sub} />
          </TouchableOpacity>
        </View>
      </View>
      <CatSwitcher />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: G.bgHeader,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: G.bgInput,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 8,
  },
  catAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,126,103,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  nameArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catName: {
    color: G.text,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  activeLabel: {
    color: G.muted,
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
