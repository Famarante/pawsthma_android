import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { FB_ON, fbLoad } from '../services/firebase';
import { G, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { normalizeData } from '../utils/data';

export default function IndexScreen() {
  const router = useRouter();
  const authReady = useAuthStore((s) => s.authReady);
  const metaReady = useAuthStore((s) => s.metaReady);
  const user = useAuthStore((s) => s.user);
  const authed = useAuthStore((s) => s.authed);
  const activeHome = useAuthStore((s) => s.activeHome);
  const loadUserMeta = useAuthStore((s) => s.loadUserMeta);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const data = useAppStore((s) => s.data);
  const setData = useAppStore((s) => s.setData);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const subscribeToHome = useAppStore((s) => s.subscribeToHome);
  const setCatId = useAppStore((s) => s.setCatId);
  const catId = useAppStore((s) => s.catId);

  useEffect(() => {
    if (!authReady) return;
    if (FB_ON && user) {
      loadUserMeta();
    } else if (!FB_ON) {
      loadDemo();
    }
  }, [authReady, user]);

  useEffect(() => {
    if (!activeHome || !FB_ON) return;
    (async () => {
      try {
        const remoteHome = await fbLoad(activeHome);
        if (!remoteHome) return;
        const normalized = normalizeData({ households: { [activeHome]: remoteHome } });
        setData(normalized);
        subscribeToHome(activeHome);
      } catch (err) {
        console.error('subscribeToHome error:', err);
      }
    })();
  }, [activeHome]);

  useEffect(() => {
    if (!authReady) return;
    if (FB_ON && !user) { router.replace('/auth'); return; }
    if (FB_ON && user && !metaReady) return;
    if (!data && !FB_ON) return;
    if (!authed || !activeHome) { router.replace('/login'); return; }
    if (!data) return;
    const homes = data.households || {};
    const home = homes[activeHome];
    if (!home) { router.replace('/login'); return; }
    if (!home.cats || home.cats.length === 0) { router.replace('/setup/cat'); return; }
    const cat = home.cats.find((c) => c.id === catId) || home.cats[0];
    if (cat && cat.id !== catId) setCatId(cat.id);
    if (!home.profiles || home.profiles.length === 0) { router.replace('/setup/profiles'); return; }
    router.replace('/(tabs)');
  }, [authReady, metaReady, user, authed, activeHome, data, catId]);

  return (
    <View style={{ flex: 1, backgroundColor: G.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <View style={{
        width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFF',
        alignItems: 'center', justifyContent: 'center', ...SHADOWS.card,
      }}>
        <MaterialIcons name="pets" size={48} color={G.primary} />
      </View>
      <Text style={{ color: G.text, fontSize: 28, fontFamily: FONTS.extraBold, letterSpacing: -0.5 }}>Pawsthma</Text>
      <Text style={{ color: G.muted, fontSize: 14, fontFamily: FONTS.regular }}>Cat Asthma Care</Text>
      <ActivityIndicator color={G.primary} style={{ marginTop: 32 }} />
      {__DEV__ && (
        <View style={{
          position: 'absolute', bottom: 40, left: 16, right: 16,
          backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 10,
          borderWidth: 1, borderColor: G.border,
        }}>
          <Text style={{ color: G.primary, fontSize: 10, fontFamily: FONTS.bold, marginBottom: 4 }}>DEBUG</Text>
          <Text style={{ color: G.text, fontSize: 10, lineHeight: 16, fontFamily: FONTS.regular }}>
            {'authReady: ' + String(authReady) + '  metaReady: ' + String(metaReady) + '\n'}
            {'user: ' + (user ? (user.email ?? user.uid) : 'null') + '\n'}
            {'authed: ' + String(authed) + '  activeHome: ' + (activeHome ?? 'null') + '\n'}
            {'data: ' + (data ? 'loaded' : 'null')}
          </Text>
        </View>
      )}
    </View>
  );
}
