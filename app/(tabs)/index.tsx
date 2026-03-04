import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { useNotifications } from '../../hooks/useNotifications';
import { G, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { fmt, buildDailyData, buildWeekTrend, attackFreeStreakDays } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { DailyChart } from '../../components/DailyChart';

export default function DashboardTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const sync = useAppStore((s) => s.sync);
  const tickSync = useAppStore((s) => s.tickSync);

  const { currentCat, attacks, inhalerLogs, profiles, ds, overdue, soon } = useHousehold();

  useNotifications();

  useEffect(() => {
    const id = setInterval(tickSync, 1000);
    return () => clearInterval(id);
  }, []);

  if (!currentCat) return null;

  const interval = currentCat.inhalerInfo.cleaningIntervalDays;
  const cleaningPct = Math.max(0, Math.min(1 - ds / Math.max(interval, 1), 1));
  const dueInDays = Math.max(0, interval - ds);
  const weeklyData = buildDailyData(attacks);
  const weekTrend = buildWeekTrend(attacks);
  const streakDays = attackFreeStreakDays(attacks);

  // Today's inhaler logs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = inhalerLogs.filter((l) => l.date === todayStr);
  const lastTodayLog = todayLogs[todayLogs.length - 1];

  // Circular progress
  const radius = 38;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - cleaningPct);

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {/* Demo warning */}
        {sync === 'demo' && (
          <View style={styles.demoWarning}>
            <MaterialIcons name="info-outline" size={16} color={G.amber} />
            <Text style={styles.demoText}>{t('demoWarning')}</Text>
          </View>
        )}

        {/* Maintenance card */}
        <View style={[styles.maintCard, SHADOWS.card]}>
          <View style={styles.maintLeft}>
            <View style={styles.maintHeader}>
              <View style={[styles.dot, { backgroundColor: overdue ? G.coral : G.mint }]} />
              <Text style={styles.maintLabel}>{t('maintenance')}</Text>
            </View>
            <Text style={styles.maintTitle}>{t('nextCleaning')}</Text>
            <Text style={styles.maintSub}>
              {overdue ? t('overdueAlert') : t('dueIn', { d: dueInDays })}
            </Text>
          </View>
          <View style={styles.ringWrap}>
            <Svg width={88} height={88}>
              <Circle
                cx={44} cy={44} r={radius}
                stroke="#E0F7F6"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={44} cy={44} r={radius}
                stroke={overdue ? G.coral : G.mint}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="44,44"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringPct}>{Math.round(cleaningPct * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Attack-free streak */}
        {streakDays >= 1 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>{t('attackFreeStreak', { n: streakDays })}</Text>
              <Text style={styles.streakSub}>{t('keepItUp')}</Text>
            </View>
          </View>
        )}

        {/* Weekly Activity */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('weeklyActivity')}</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>{t('last7Days')}</Text>
          </View>
        </View>
        {weekTrend.diff !== 0 && (
          <Text style={[styles.trendText, { color: weekTrend.diff > 0 ? G.coral : G.mint }]}>
            {weekTrend.diff > 0
              ? t('weekTrendMore', { n: weekTrend.diff })
              : t('weekTrendFewer', { n: Math.abs(weekTrend.diff) })}
          </Text>
        )}
        {weekTrend.diff === 0 && weekTrend.thisWeek > 0 && (
          <Text style={[styles.trendText, { color: G.sub }]}>{t('weekTrendSame')}</Text>
        )}
        <View style={[styles.card, SHADOWS.card]}>
          <DailyChart data={weeklyData} />
        </View>

        {/* Today section */}
        {lastTodayLog && (
          <>
            <Text style={styles.sectionLabel}>{t('today')}</Text>
            <View style={[styles.todayCard, SHADOWS.card]}>
              <View style={styles.todayIcon}>
                <MaterialIcons name="medication" size={20} color={G.mint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayTitle}>{lastTodayLog.dosage || t('dosage')}</Text>
                <Text style={styles.todaySub}>
                  {t('breaths', { count: lastTodayLog.breaths })}
                </Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{fmt(lastTodayLog.date, lang)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  demoWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  demoText: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular, flex: 1 },

  // Maintenance card
  maintCard: {
    backgroundColor: '#E8FAF9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.20)',
  },
  maintLeft: { flex: 1, marginRight: 12 },
  maintHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  maintLabel: {
    color: G.sub,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  maintTitle: {
    color: G.text,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginBottom: 4,
  },
  maintSub: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular },
  ringWrap: {
    width: 88,
    height: 88,
  },
  ringCenter: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: { color: G.text, fontSize: 16, fontFamily: FONTS.bold },

  // Sections
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  pillBadge: {
    backgroundColor: G.surface,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  pillText: { color: G.sub, fontSize: 11, fontFamily: FONTS.semiBold },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  // Streak
  streakCard: {
    backgroundColor: '#FFF9EB',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  streakEmoji: { fontSize: 28 },
  streakTitle: { color: G.text, fontSize: 15, fontFamily: FONTS.bold },
  streakSub: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

  // Trend
  trendText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
    marginTop: -8,
  },

  // Today
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  todayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayTitle: { color: G.text, fontSize: 15, fontFamily: FONTS.bold },
  todaySub: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  timeBadge: {
    backgroundColor: G.surface,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  timeText: { color: G.sub, fontSize: 11, fontFamily: FONTS.semiBold },
});
