import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { fmt, fmtDuration, daysBetween, today } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { WeeklyChart } from '../../components/WeeklyChart';
import { DurationChart } from '../../components/DurationChart';
import { SeverityPie } from '../../components/SeverityPie';
import { buildWeeklyData } from '../../utils/data';

const OBS_ICONS = ['event-note', 'trending-up', 'error-outline', 'air'] as const;

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

  // Adherence: days with inhaler in last 30 / 30
  const todayDate = new Date();
  const last30 = new Set<string>();
  inhalerLogs.forEach((l) => {
    const d = new Date(l.date);
    const diff = Math.floor((todayDate.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 30) last30.add(l.date);
  });
  const adherence = Math.round((last30.size / 30) * 100);

  // Trend: attacks in last 30 vs prior 30
  const last30Attacks = attacks.filter((a) => {
    const diff = Math.floor((todayDate.getTime() - new Date(a.date).getTime()) / 86400000);
    return diff >= 0 && diff < 30;
  }).length;
  const prior30Attacks = attacks.filter((a) => {
    const diff = Math.floor((todayDate.getTime() - new Date(a.date).getTime()) / 86400000);
    return diff >= 30 && diff < 60;
  }).length;
  const trendPct = prior30Attacks > 0
    ? Math.round(((last30Attacks - prior30Attacks) / prior30Attacks) * 100)
    : 0;
  const trendDown = trendPct <= 0;

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

  const obsColors = [G.amber, G.indigo, G.coral, G.mint];

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>{t('healthInsights')}</Text>
            <Text style={styles.headerSub}>{t('last30Summary')}</Text>
          </View>
          <View style={styles.calendarBtn}>
            <MaterialIcons name="calendar-today" size={18} color={G.sub} />
          </View>
        </View>

        {/* 3-column stat cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FFF1EB' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,126,103,0.15)' }]}>
              <MaterialIcons name="priority-high" size={18} color={G.primary} />
            </View>
            <Text style={[styles.statValue, { color: G.primary }]}>{last30Attacks}</Text>
            <Text style={styles.statLabel}>{t('attacks')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E6F5F0' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(78,205,196,0.15)' }]}>
              <MaterialIcons name="check-circle" size={18} color={G.mint} />
            </View>
            <Text style={[styles.statValue, { color: G.mint }]}>{adherence}%</Text>
            <Text style={styles.statLabel}>{t('adherence')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
              <MaterialIcons
                name={trendDown ? 'trending-down' : 'trending-up'}
                size={18}
                color={G.golden}
              />
            </View>
            <Text style={[styles.statValue, { color: G.golden }]}>{trendPct}%</Text>
            <Text style={styles.statLabel}>{t('trend')}</Text>
          </View>
        </View>

        {/* Duration trend (line chart) */}
        <Text style={styles.sectionLabel}>{t('attackFrequency')}</Text>
        <View style={[styles.card, SHADOWS.card]}>
          <DurationChart data={durTrend} />
        </View>

        {/* Severity distribution (donut) */}
        <Text style={styles.sectionLabel}>{t('sevDist')}</Text>
        <View style={[styles.card, SHADOWS.card]}>
          <SeverityPie data={sevDist} />
        </View>

        {/* Weekly overview */}
        <Text style={styles.sectionLabel}>{t('weekly')}</Text>
        <View style={[styles.card, SHADOWS.card]}>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Observations */}
        <Text style={styles.sectionLabel}>{t('topTriggers')}</Text>
        {observations.map((text, i) => (
          <View key={i} style={[styles.obsCard, SHADOWS.card]}>
            <View style={[styles.obsIcon, { backgroundColor: `${obsColors[i]}12` }]}>
              <MaterialIcons name={(OBS_ICONS[i] || 'lightbulb') as any} size={18} color={obsColors[i]} />
            </View>
            <Text style={styles.obsText}>{text}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    color: G.text,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  headerSub: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontFamily: FONTS.extraBold, lineHeight: 28 },
  statLabel: {
    color: G.sub,
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // Section
  sectionLabel: {
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  // Observations
  obsCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  obsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obsText: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, lineHeight: 20, flex: 1 },
});
