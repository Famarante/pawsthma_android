import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { useHousehold } from '../hooks/useHousehold';
import { G, PCOLS } from '../constants/colors';
import { SyncBadge } from './SyncBadge';
import { LangToggle } from './LangToggle';
import { FB_ON } from '../services/firebase';
import { clearDeviceHome } from '../services/storage';

export function AppHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const uid = useAuthStore((s) => s.uid);
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);
  const logout = useAuthStore((s) => s.logout);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const setActiveHome = useAuthStore((s) => s.setActiveHome);
  const deviceId = useAuthStore((s) => s.deviceId);

  const setShowMgr = useAppStore((s) => s.setShowMgr);
  const setCatId = useAppStore((s) => s.setCatId);
  const setModal = useAppStore((s) => s.setModal);
  const createInviteCode = useAppStore((s) => s.createInviteCode);

  const { homeKey, currentHome, currentCat, me, profiles } = useHousehold();
  const myColor = me?.color || G.amber;

  const handleCreateInvite = async () => {
    if (!homeKey) return;
    const code = await createInviteCode(homeKey, uid);
    if (code) {
      Alert.alert(t('inviteCreated'), code, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('shareInvite'),
          onPress: () => Share.share({ message: code }),
        },
      ]);
    }
  };

  const handleSwitchHousehold = async () => {
    await clearDeviceHome(deviceId);
    setAuthed(false);
    setActiveHome(null);
    setCatId(null);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 18 }}>🐱</Text>
          </View>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.appName}>Pawsthma</Text>
              <TouchableOpacity
                style={[styles.badge, { backgroundColor: `${myColor}18`, borderColor: `${myColor}40` }]}
                onPress={() => setShowMgr(true)}
              >
                <Text style={[styles.badgeText, { color: myColor }]}>
                  {me?.emoji} {me?.name}
                </Text>
              </TouchableOpacity>
              {currentCat && (
                <TouchableOpacity
                  style={[styles.badge, { backgroundColor: `${G.mint}18`, borderColor: `${G.mint}40` }]}
                  onPress={() => setCatId(null)}
                >
                  <Text style={[styles.badgeText, { color: G.mint }]}>🐱 {currentCat.name}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.badge, { backgroundColor: `${G.amber}18`, borderColor: `${G.amber}40` }]}
                onPress={handleSwitchHousehold}
              >
                <Text style={[styles.badgeText, { color: G.amber }]}>
                  🏠 {currentHome?.name || 'Home'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subText}>{t('sub')}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleCreateInvite}>
            <Text>🔗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMgr(true)}>
            <Text>👥</Text>
          </TouchableOpacity>
          {FB_ON && (
            <TouchableOpacity style={styles.iconBtn} onPress={logout}>
              <Text style={{ color: G.muted, fontSize: 14 }}>⎋</Text>
            </TouchableOpacity>
          )}
          <LangToggle lang={lang} setLang={setLang} compact />
        </View>
      </View>

      {/* Sync badge */}
      <SyncBadge />

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: `${G.coral}18`, borderColor: `${G.coral}40` }]}
          onPress={() => setModal('attack')}
        >
          <Text style={[styles.actionText, { color: G.coral }]}>{t('btnA')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: `${G.mint}18`, borderColor: `${G.mint}40` }]}
          onPress={() => setModal('inhaler')}
        >
          <Text style={[styles.actionText, { color: G.mint }]}>{t('btnI')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(10,15,30,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: G.border,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftSection: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: G.amber,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  appName: {
    color: G.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 20,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  subText: { color: G.muted, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  rightSection: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
