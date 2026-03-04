import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { G, SEV } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { WeekBucket } from '../utils/data';

const W = Dimensions.get('window').width - 64;
const CHART_H = 150;

interface Props {
  data: WeekBucket[];
}

export function WeeklyChart({ data }: Props) {
  const { t } = useTranslation();

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: G.muted, fontSize: 13, fontFamily: FONTS.regular }}>No data yet</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.mild + d.moderate + d.severe), 1);
  const barW = (W / data.length) * 0.55;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {data.map((bucket) => {
          const total = bucket.mild + bucket.moderate + bucket.severe;
          const mildH = (bucket.mild / maxVal) * CHART_H;
          const modH = (bucket.moderate / maxVal) * CHART_H;
          const sevH = (bucket.severe / maxVal) * CHART_H;

          return (
            <View key={bucket.week} style={{ flex: 1, alignItems: 'center' }}>
              {/* count badge */}
              {total > 0 ? (
                <Text style={styles.countBadge}>{total}</Text>
              ) : (
                <View style={{ height: 18 }} />
              )}

              {/* bar area */}
              <View style={{ width: barW, height: CHART_H }}>
                {/* ghost background */}
                <View style={[styles.abs, { height: CHART_H, bottom: 0, backgroundColor: G.border, opacity: 0.4, borderRadius: 5 }]} />

                {/* mild: base of the bar */}
                {mildH > 0 && (
                  <View style={[styles.abs, {
                    height: mildH,
                    bottom: 0,
                    backgroundColor: SEV.mild,
                    borderTopLeftRadius: modH === 0 && sevH === 0 ? 5 : 0,
                    borderTopRightRadius: modH === 0 && sevH === 0 ? 5 : 0,
                  }]} />
                )}

                {/* moderate: above mild */}
                {modH > 0 && (
                  <View style={[styles.abs, {
                    height: modH,
                    bottom: mildH,
                    backgroundColor: SEV.moderate,
                    borderTopLeftRadius: sevH === 0 ? 5 : 0,
                    borderTopRightRadius: sevH === 0 ? 5 : 0,
                  }]} />
                )}

                {/* severe: top of the bar */}
                {sevH > 0 && (
                  <View style={[styles.abs, {
                    height: sevH,
                    bottom: mildH + modH,
                    backgroundColor: SEV.severe,
                    borderTopLeftRadius: 5,
                    borderTopRightRadius: 5,
                  }]} />
                )}
              </View>

              {/* week label */}
              <Text style={styles.axisLabel} numberOfLines={1}>{bucket.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(['mild', 'moderate', 'severe'] as const).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SEV[s] }]} />
            <Text style={styles.legendText}>{t(`sevLabels.${s}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: CHART_H, alignItems: 'center', justifyContent: 'center' },
  countBadge: {
    color: G.text,
    fontSize: 11,
    fontFamily: FONTS.bold,
    height: 18,
    textAlign: 'center',
    marginBottom: 2,
  },
  abs: { position: 'absolute', left: 0, right: 0 },
  axisLabel: { color: G.sub, fontSize: 10, fontFamily: FONTS.regular, marginTop: 6, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: G.sub, fontSize: 10, fontFamily: FONTS.medium },
});
