import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';
import { G } from '../constants/colors';
import { SyncStatus } from '../types';

interface SyncConfig {
  color: string;
  dot: string;
  pulse: boolean;
  label: string;
}

export function SyncBadge() {
  const { t } = useTranslation();
  const sync = useAppStore((s) => s.sync);
  const syncSecs = useAppStore((s) => s.syncSecs);

  const cfg: Record<SyncStatus, SyncConfig> = {
    loading: { color: G.muted, dot: G.muted, pulse: true, label: '…' },
    live: { color: G.mint, dot: G.mint, pulse: false, label: t('syncLive') },
    updated: { color: G.mint, dot: G.mint, pulse: false, label: t('syncUpdated') },
    error: { color: G.coral, dot: G.coral, pulse: true, label: t('syncError') },
    synced: { color: G.muted, dot: G.mint, pulse: false, label: t('syncAgo', { s: syncSecs }) },
    demo: { color: G.amber, dot: G.amber, pulse: false, label: t('syncDemo') },
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, letterSpacing: 0.5 },
});
