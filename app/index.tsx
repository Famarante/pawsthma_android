import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { FB_ON } from '../services/firebase';
import { G } from '../constants/colors';
import { normalizeData } from '../utils/data';
import { fbLoad } from '../services/firebase';
import { lsLoad } from '../services/storage';

export default function IndexScreen() {
  const router = useRouter();
  const authReady = useAuthStore((s) => s.authReady);
  const metaReady = useAuthStore((s) => s.metaReady);
  const user = useAuthStore((s) => s.user);
  const authed = useAuthStore((s) => s.authed);
  const activeHome = useAuthStore((s) => s.activeHome);
  const loadUserMeta = useAuthStore((s) => s.loadUserMeta);
  const setActiveHome = useAuthStore((s) => s.setActiveHome);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const data = useAppStore((s) => s.data);
  const setData = useAppStore((s) => s.setData);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const subscribeToHome = useAppStore((s) => s.subscribeToHome);
  const setCatId = useAppStore((s) => s.setCatId);
  const catId = useAppStore((s) => s.catId);

  // Step 1: Wait for auth ready, then load user meta or demo
  useEffect(() => {
    if (!authReady) return;

    if (FB_ON && user) {
      loadUserMeta();
    } else if (!FB_ON) {
      loadDemo();
    }
  }, [authReady, user]);

  // Step 2: Subscribe to active home when it changes
  useEffect(() => {
    if (!activeHome || !FB_ON) return;

    (async () => {
      try {
        let remoteHome = await fbLoad(activeHome);
        if (!remoteHome) {
          // New household — will be created in login flow
          return;
        }
        const normalized = normalizeData({ households: { [activeHome]: remoteHome } });
        setData(normalized);
        subscribeToHome(activeHome);
      } catch (err) {
        console.error('subscribeToHome error:', err);
      }
    })();
  }, [activeHome]);

  // Step 3: Route based on state
  useEffect(() => {
    if (!authReady) return;

    if (FB_ON && !user) {
      router.replace('/auth');
      return;
    }

    if (FB_ON && user && !metaReady) return; // wait for loadUserMeta() to finish

    if (!data && !FB_ON) return; // still loading demo

    if (!authed || !activeHome) {
      router.replace('/login');
      return;
    }

    if (!data) return;

    const homes = data.households || {};
    const home = homes[activeHome];
    if (!home) {
      router.replace('/login');
      return;
    }

    if (!home.cats || home.cats.length === 0) {
      router.replace('/setup/cat');
      return;
    }

    // Pick cat
    const cat = home.cats.find((c) => c.id === catId) || home.cats[0];
    if (cat && cat.id !== catId) {
      setCatId(cat.id);
    }

    if (!home.profiles || home.profiles.length === 0) {
      router.replace('/setup/profiles');
      return;
    }

    router.replace('/(tabs)');
  }, [authReady, metaReady, user, authed, activeHome, data, catId]);

  return (
    <View style={{ flex: 1, backgroundColor: G.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontSize: 52 }}>🐱</Text>
      <Text style={{ color: G.text, fontSize: 22, fontWeight: '700' }}>Pawsthma</Text>
      <ActivityIndicator color={G.amber} />
    </View>
  );
}
