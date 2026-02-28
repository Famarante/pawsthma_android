import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { useNotifications } from '../../hooks/useNotifications';
import { G, SEV } from '../../constants/colors';
import { fmt, buildWeeklyData } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { AttackModal } from '../../components/modals/AttackModal';
import { InhalerModal } from '../../components/modals/InhalerModal';
import { ProfileManager } from '../../components/ProfileManager';
import { WeeklyChart } from '../../components/WeeklyChart';
import { WhoBadge } from '../../components/WhoBadge';

export default function DashboardTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const sync = useAppStore((s) => s.sync);
  const tickSync = useAppStore((s) => s.tickSync);

  const { currentCat, attacks, inhalerLogs, profiles, ds, overdue, soon, others } = useHousehold();

  // Enable push notifications
  useNotifications();

  // Tick sync counter
  useEffect(() => {
    const id = setInterval(tickSync, 1000);
    return () => clearInterval(id);
  }, []);

  if (!currentCat) return null;

  const sorted = [...attacks].sort((a, b) => a.date.localeCompare(b.date));
  const lastA = sorted[sorted.length - 1];
  const sortedI = [...inhalerLogs].sort((a, b) => a.date.localeCompare(b.date));
  const lastI = sortedI[sortedI.length - 1];
  const weeklyData = buildWeeklyData(attacks, lang);

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {/* Demo warning */}
        {sync === 'demo' && (
          <View style={styles.demoWarning}>
            <Text style={{ color: G.muted, fontSize: 12, lineHeight: 18 }}>⚠️ {t('demoWarning')}</Text>
          </View>
        )}

        {/* Shared with others */}
        {others.length > 0 && (
          <View style={styles.sharedBadge}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
            <Text style={{ color: G.muted, fontSize: 12 }}>
              {t('sharedWith', { n: others.map((p) => `${p.emoji} ${p.name}`).join(', ') })}
            </Text>
          </View>
        )}

        {/* Cleaning alert */}
        {(overdue || soon) && (
          <View style={[styles.alert, { backgroundColor: overdue ? 'rgba(255,107,107,0.12)' : 'rgba(245,166,35,0.1)', borderColor: overdue ? 'rgba(255,107,107,0.3)' : G.bBright }]}>
            <Text style={{ fontSize: 22 }}>{overdue ? '🚨' : '⚠️'}</Text>
            <View>
              <Text style={[styles.alertTitle, { color: overdue ? G.coral : G.amber }]}>
                {overdue ? t('overdueAlert') : t('soonAlert')}
              </Text>
              <Text style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>
                {t('daysSince', { d: ds, i: currentCat.inhalerInfo.cleaningIntervalDays })}
              </Text>
            </View>
          </View>
        )}

        {/* Total attacks hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('totalAttacks')}</Text>
          <Text style={styles.heroNumber}>{attacks.length}</Text>
          <View style={styles.sevRow}>
            {(['mild', 'moderate', 'severe'] as const).map((s) => (
              <View key={s}>
                <Text style={[styles.sevCount, { color: SEV[s] }]}>
                  {attacks.filter((a) => a.severity === s).length}
                </Text>
                <Text style={styles.sevLabel}>{t(`sevLabels.${s}`)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Last attack / inhaler row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('lastAttack')}</Text>
            <Text style={styles.statValue}>{lastA ? fmt(lastA.date, lang) : '—'}</Text>
            {lastA && (
              <View style={styles.statBadgeRow}>
                <View style={[styles.sevBadge, { backgroundColor: `${SEV[lastA.severity]}18` }]}>
                  <Text style={[styles.sevBadgeText, { color: SEV[lastA.severity] }]}>
                    {t(`sevLabels.${lastA.severity}`)}
                  </Text>
                </View>
                <WhoBadge addedBy={lastA.addedBy} profiles={profiles} />
              </View>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('lastInhaler')}</Text>
            <Text style={styles.statValue}>{lastI ? fmt(lastI.date, lang) : '—'}</Text>
            {lastI && (
              <View style={styles.statBadgeRow}>
                <Text style={{ fontSize: 12, color: G.mint }}>💨 {t('breaths', { count: lastI.breaths })}</Text>
                <WhoBadge addedBy={lastI.addedBy} profiles={profiles} />
              </View>
            )}
          </View>
        </View>

        {/* Weekly chart */}
        <Text style={styles.sectionLabel}>{t('weekly')}</Text>
        <View style={styles.card}>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Inhaler status */}
        <Text style={styles.sectionLabel}>{t('inhalerStatus')}</Text>
        <View style={styles.card}>
          <View style={styles.inhalerGrid}>
            {[
              [t('dosage'), currentCat.inhalerInfo.dosage, null],
              [t('lastCleaned'), fmt(currentCat.inhalerInfo.lastCleaned, lang), null],
              [t('daysSinceClean'), `${ds}${t('d')}`, overdue ? G.coral : soon ? G.amber : G.mint],
              [t('cleanInterval'), `${currentCat.inhalerInfo.cleaningIntervalDays}${t('d')}`, null],
            ].map(([label, value, accent]) => (
              <View key={String(label)}>
                <Text style={styles.inhalerLabel}>{label}</Text>
                <Text style={[styles.inhalerValue, accent ? { color: accent as string } : {}]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AttackModal />
      <InhalerModal />
      <ProfileManager />
    </>
  );
}

const card = {
  backgroundColor: G.surface,
  borderWidth: 1,
  borderColor: G.border,
  borderRadius: 20,
  padding: 18,
  marginBottom: 16,
};

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  demoWarning: {
    backgroundColor: 'rgba(245,166,35,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(78,205,196,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.15)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertTitle: { fontWeight: '600', fontSize: 13 },
  heroCard: {
    ...card,
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderColor: G.bBright,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  heroLabel: { color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroNumber: { color: G.amber, fontSize: 60, fontWeight: '700', lineHeight: 64 },
  sevRow: { flexDirection: 'row', gap: 20, marginTop: 16 },
  sevCount: { fontSize: 20, fontWeight: '700' },
  sevLabel: { color: G.muted, fontSize: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { ...card, flex: 1, marginBottom: 0 },
  statLabel: { color: G.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { color: G.text, fontSize: 20, fontWeight: '700', marginTop: 6 },
  statBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' },
  sevBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  sevBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  sectionLabel: {
    color: G.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 12,
  },
  card,
  inhalerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  inhalerLabel: { color: G.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  inhalerValue: { color: G.text, fontSize: 15, fontWeight: '600' },
});
