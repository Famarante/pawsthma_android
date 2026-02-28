import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { G, SEV } from '../constants/colors';

interface Slice {
  name: 'mild' | 'moderate' | 'severe';
  value: number;
  label: string;
}

interface Props {
  data: Slice[];
}

export function SeverityPie({ data }: Props) {
  const { t } = useTranslation();

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: G.muted, fontSize: 13 }}>No data yet</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.container}>
      {/* Bar chart style visualization (simpler and more readable on mobile) */}
      <View style={styles.bars}>
        {data.map((slice) => {
          const pct = (slice.value / total) * 100;
          return (
            <View key={slice.name} style={styles.barRow}>
              <Text style={[styles.barLabel, { color: SEV[slice.name] }]}>
                {t(`sevLabels.${slice.name}`)}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct}%` as any, backgroundColor: SEV[slice.name] },
                  ]}
                />
              </View>
              <Text style={[styles.barValue, { color: SEV[slice.name] }]}>{slice.value}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend with count */}
      <View style={styles.legend}>
        {data.map((s) => (
          <View key={s.name} style={styles.legendItem}>
            <Text style={[styles.legendCount, { color: SEV[s.name] }]}>{s.value}</Text>
            <Text style={styles.legendLabel}>{t(`sevLabels.${s.name}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: 100, alignItems: 'center', justifyContent: 'center' },
  container: { gap: 16 },
  bars: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 70, fontSize: 11, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5, opacity: 0.85 },
  barValue: { width: 20, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  legendItem: { alignItems: 'center' },
  legendCount: { fontSize: 20, fontWeight: '700' },
  legendLabel: { color: G.muted, fontSize: 10, marginTop: 2 },
});
