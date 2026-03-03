import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { G } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { SyncStatus } from '../types';

interface SyncConfig {
  color: string;
  dot: string;
  label: string;
}

export function SyncBadge() {
  const { t } = useTranslation();
  const sync = useAppStore((s) => s.sync);
  const syncSecs = useAppStore((s) => s.syncSecs);

  const cfg: Record<SyncStatus, SyncConfig> = {
    loading: { color: G.muted, dot: G.muted, label: '...' },
    live: { color: G.mint, dot: G.mint, label: t('syncLive') },
    updated: { color: G.mint, dot: G.mint, label: t('syncUpdated') },
    error: { color: G.coral, dot: G.coral, label: t('syncError') },
    synced: { color: G.muted, dot: G.mint, label: t('syncAgo', { s: syncSecs }) },
    demo: { color: G.amber, dot: G.amber, label: t('syncDemo') },
  };

  const c = cfg[sync] || cfg.live;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  label: { fontSize: 11, fontFamily: FONTS.medium, letterSpacing: 0.3 },
});
