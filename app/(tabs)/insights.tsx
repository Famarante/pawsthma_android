import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { fmt, daysBetween, today } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { WeeklyChart } from '../../components/WeeklyChart';
import { DurationChart } from '../../components/DurationChart';
import { SeverityPie } from '../../components/SeverityPie';
import { buildWeeklyData } from '../../utils/data';

type DateRange = '30' | '90' | 'all';

const OBS_ICONS = ['event-note', 'trending-up', 'error-outline', 'air'] as const;

export default function InsightsTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const { attacks, inhalerLogs } = useHousehold();
  const [range, setRange] = useState<DateRange>('30');
  const [showRangePicker, setShowRangePicker] = useState(false);

  const todayDate = new Date();
  const rangeDays = range === '30' ? 30 : range === '90' ? 90 : Infinity;

  const filteredAttacks = range === 'all' ? attacks : attacks.filter((a) => {
    const diff = Math.floor((todayDate.getTime() - new Date(a.date).getTime()) / 86400000);
    return diff >= 0 && diff < rangeDays;
  });
  const filteredLogs = range === 'all' ? inhalerLogs : inhalerLogs.filter((l) => {
    const diff = Math.floor((todayDate.getTime() - new Date(l.date).getTime()) / 86400000);
    return diff >= 0 && diff < rangeDays;
  });

  const sorted = [...filteredAttacks].sort((a, b) => a.date.localeCompare(b.date));
  const lastA = sorted[sorted.length - 1];

  const avgD = filteredAttacks.length
    ? (filteredAttacks.reduce((s, a) => s + a.duration, 0) / filteredAttacks.length).toFixed(1)
    : '0';
  const sevN = filteredAttacks.filter((a) => a.severity === 'severe').length;

  // Adherence: days with inhaler / range days
  const adherenceDays = new Set<string>();
  filteredLogs.forEach((l) => adherenceDays.add(l.date.split('T')[0]));
  const adherencePeriod = range === 'all' ? Math.max(1, daysBetween(sorted[0]?.date || today(), today())) : rangeDays;
  const adherence = Math.round((adherenceDays.size / Math.min(adherencePeriod, 30)) * 100);

  // Trend: current period vs previous period
  const periodDays = range === 'all' ? 30 : rangeDays;
  const priorAttacks = attacks.filter((a) => {
    const diff = Math.floor((todayDate.getTime() - new Date(a.date).getTime()) / 86400000);
    return diff >= periodDays && diff < periodDays * 2;
  }).length;
  const trendPct = priorAttacks > 0
    ? Math.round(((filteredAttacks.length - priorAttacks) / priorAttacks) * 100)
    : 0;
  const trendDown = trendPct <= 0;

  // Trigger insights
  const allTriggers: string[] = [];
  filteredAttacks.forEach((a) => { if (a.triggers) allTriggers.push(...a.triggers); });
  const triggerCounts: Record<string, number> = {};
  allTriggers.forEach((tr) => { triggerCounts[tr] = (triggerCounts[tr] || 0) + 1; });
  const topTriggerEntry = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];

  const durTrend = sorted.map((a) => ({ date: fmt(a.date, lang), duration: a.duration }));
  const weeklyData = buildWeeklyData(filteredAttacks, lang);

  const rangeLabel = range === '30' ? t('last30Days') : range === '90' ? t('last90Days') : t('allTime');

  const sevDist = (['mild', 'moderate', 'severe'] as const)
    .map((n) => ({
      name: n,
      label: t(`sevLabels.${n}`),
      value: filteredAttacks.filter((a) => a.severity === n).length,
    }))
    .filter((x) => x.value > 0);

  const observations = [
    lastA && t('obs1', { d: daysBetween(lastA.date, today()), s: t(`sevLabels.${lastA.severity}`) }),
    t('obs2', { a: avgD }),
    sevN > 0 && t('obs3', { count: sevN }),
    t('obs4', { count: filteredLogs.length }),
    topTriggerEntry && t('topTriggerInsight', {
      trigger: t(`triggerLabels.${topTriggerEntry[0]}`),
      count: topTriggerEntry[1],
      total: filteredAttacks.length,
    }),
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
            <Text style={styles.headerSub}>{rangeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowRangePicker(true)}>
            <MaterialIcons name="calendar-today" size={18} color={G.sub} />
          </TouchableOpacity>
        </View>

        {/* 3-column stat cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FFF1EB' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,126,103,0.15)' }]}>
              <MaterialIcons name="priority-high" size={18} color={G.primary} />
            </View>
            <Text style={[styles.statValue, { color: G.primary }]}>{filteredAttacks.length}</Text>
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
            <View style={[styles.obsIcon, { backgroundColor: `${obsColors[Math.min(i, obsColors.length - 1)]}12` }]}>
              <MaterialIcons name={(OBS_ICONS[Math.min(i, OBS_ICONS.length - 1)] || 'lightbulb') as any} size={18} color={obsColors[Math.min(i, obsColors.length - 1)]} />
            </View>
            <Text style={styles.obsText}>{text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Date range picker modal */}
      <Modal
        isVisible={showRangePicker}
        onBackdropPress={() => setShowRangePicker(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.35}
      >
        <View style={styles.rangeSheet}>
          <View style={styles.rangeHandle} />
          <Text style={styles.rangeTitle}>{t('dateRange')}</Text>
          {([['30', t('last30Days')], ['90', t('last90Days')], ['all', t('allTime')]] as [DateRange, string][]).map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.rangeOption, range === val && styles.rangeOptionActive]}
              onPress={() => { setRange(val); setShowRangePicker(false); }}
            >
              <Text style={[styles.rangeOptionText, range === val && { color: G.primary, fontFamily: FONTS.bold }]}>
                {label}
              </Text>
              {range === val && <MaterialIcons name="check" size={18} color={G.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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

  // Range picker
  rangeSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  rangeHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  rangeTitle: {
    color: G.text,
    fontSize: 17,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  rangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rangeOptionActive: {},
  rangeOptionText: { flex: 1, color: G.text, fontSize: 15, fontFamily: FONTS.medium },
});
