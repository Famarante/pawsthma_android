import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV } from '../../constants/colors';
import { fmt, fmtDuration, daysBetween, today } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { AttackModal } from '../../components/modals/AttackModal';
import { InhalerModal } from '../../components/modals/InhalerModal';
import { ProfileManager } from '../../components/ProfileManager';
import { WeeklyChart } from '../../components/WeeklyChart';
import { DurationChart } from '../../components/DurationChart';
import { SeverityPie } from '../../components/SeverityPie';
import { buildWeeklyData } from '../../utils/data';

export default function InsightsTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const { attacks, inhalerLogs } = useHousehold();

  const sorted = [...attacks].sort((a, b) => a.date.localeCompare(b.date));
  const lastA = sorted[sorted.length - 1];

  const avgD = attacks.length
    ? (attacks.reduce((s, a) => s + a.duration, 0) / attacks.length).toFixed(1)
    : '0';
  const sevN = attacks.filter((a) => a.severity === 'severe').length;
  const avgB = (
    inhalerLogs.reduce((s, l) => s + l.breaths, 0) / (inhalerLogs.length || 1)
  ).toFixed(1);

  const durTrend = sorted.map((a) => ({ date: fmt(a.date, lang), duration: a.duration }));
  const weeklyData = buildWeeklyData(attacks, lang);

  const sevDist = (['mild', 'moderate', 'severe'] as const)
    .map((n) => ({
      name: n,
      label: t(`sevLabels.${n}`),
      value: attacks.filter((a) => a.severity === n).length,
    }))
    .filter((x) => x.value > 0);

  const observations = [
    lastA && t('obs1', { d: daysBetween(lastA.date, today()), s: t(`sevLabels.${lastA.severity}`) }),
    t('obs2', { a: avgD }),
    sevN > 0 && t('obs3', { count: sevN }),
    t('obs4', { count: inhalerLogs.length }),
  ].filter(Boolean) as string[];

  const obsIcons = ['📅', '📈', '🔴', '💨'];

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            [avgD, t('m'), t('avgDur'), G.amber],
            [sevN, '', t('sevEps'), G.coral],
            [avgB, t('br'), t('avgBr'), G.mint],
          ].map(([value, unit, label, color]) => (
            <View key={String(label)} style={[styles.statCard, { backgroundColor: `${color}0d`, borderColor: `${color}30` }]}>
              <Text style={[styles.statValue, { color: color as string }]}>
                {value}<Text style={{ fontSize: 12 }}>{unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Duration trend */}
        <Text style={styles.sectionLabel}>{t('durationTrend')}</Text>
        <View style={styles.card}>
          <DurationChart data={durTrend} />
        </View>

        {/* Severity distribution */}
        <Text style={styles.sectionLabel}>{t('sevDist')}</Text>
        <View style={styles.card}>
          <SeverityPie data={sevDist} />
        </View>

        {/* Weekly overview */}
        <Text style={styles.sectionLabel}>{t('weekly')}</Text>
        <View style={styles.card}>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Observations */}
        <Text style={styles.sectionLabel}>{t('obs')}</Text>
        {observations.map((text, i) => (
          <View key={i} style={styles.obsCard}>
            <Text style={{ fontSize: 18, flexShrink: 0 }}>{obsIcons[i] || '💡'}</Text>
            <Text style={styles.obsText}>{text}</Text>
          </View>
        ))}
      </ScrollView>

      <AttackModal />
      <InhalerModal />
      <ProfileManager />
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
  statLabel: { color: G.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6, textAlign: 'center', lineHeight: 13 },
  sectionLabel: {
    color: G.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  obsCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  obsText: { color: 'rgba(240,236,228,0.65)', fontSize: 13, lineHeight: 20, flex: 1 },
});
