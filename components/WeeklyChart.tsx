import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { G, SEV } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { WeekBucket } from '../utils/data';

const W = Dimensions.get('window').width - 64;
const CHART_H = 160;

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
  const barW = Math.min(12, (W / data.length) * 0.6);
  const gap = (W / data.length) * 0.4;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: gap / 2, paddingHorizontal: gap / 4 }}>
        {data.map((bucket) => {
          const mildH = (bucket.mild / maxVal) * CHART_H;
          const modH = (bucket.moderate / maxVal) * CHART_H;
          const sevH = (bucket.severe / maxVal) * CHART_H;

          return (
            <View key={bucket.week} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '100%', height: CHART_H, justifyContent: 'flex-end', alignItems: 'center' }}>
                {mildH > 0 && (
                  <View style={[styles.barSegment, { height: mildH, width: barW, backgroundColor: SEV.mild, borderRadius: 6 }]} />
                )}
                {modH > 0 && (
                  <View style={[styles.barSegment, { height: modH, width: barW, backgroundColor: SEV.moderate, borderRadius: 6 }]} />
                )}
                {sevH > 0 && (
                  <View style={[styles.barSegment, { height: sevH, width: barW, backgroundColor: SEV.severe, borderTopLeftRadius: 6, borderTopRightRadius: 6 }]} />
                )}
              </View>
              <Text style={styles.axisLabel} numberOfLines={1}>{bucket.label.split('–')[0]}</Text>
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
  barSegment: { alignSelf: 'center' },
  axisLabel: { color: G.sub, fontSize: 10, fontFamily: FONTS.regular, marginTop: 6, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: G.sub, fontSize: 10, fontFamily: FONTS.medium },
});
