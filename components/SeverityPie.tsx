import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { G, SEV } from '../constants/colors';
import { FONTS } from '../constants/fonts';

interface Slice {
  name: 'mild' | 'moderate' | 'severe';
  value: number;
  label: string;
}

interface Props {
  data: Slice[];
}

const SIZE = 120;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SeverityPie({ data }: Props) {
  const { t } = useTranslation();

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: G.muted, fontSize: 13, fontFamily: FONTS.regular }}>No data yet</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  // Build segments
  let offset = 0;
  const segments = data.map((slice) => {
    const pct = slice.value / total;
    const dashArray = pct * CIRCUMFERENCE;
    const dashOffset = -offset;
    offset += dashArray;
    return { ...slice, pct, dashArray, dashOffset };
  });

  return (
    <View style={styles.container}>
      {/* Donut */}
      <View style={styles.donutWrap}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background ring */}
          <SvgCircle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={G.surface}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Segments */}
          {segments.map((seg) => (
            <SvgCircle
              key={seg.name}
              cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
              stroke={SEV[seg.name]}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${seg.dashArray} ${CIRCUMFERENCE - seg.dashArray}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2},${SIZE / 2}`}
            />
          ))}
        </Svg>
        {/* Center text */}
        <View style={styles.centerText}>
          <Text style={styles.centerCount}>{total}</Text>
          <Text style={styles.centerLabel}>TOTAL</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((s) => (
          <View key={s.name} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: SEV[s.name] }]} />
            <Text style={styles.legendLabel}>{t(`sevLabels.${s.name}`)}</Text>
            <Text style={styles.legendPct}>
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: 100, alignItems: 'center', justifyContent: 'center' },
  container: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  donutWrap: { width: SIZE, height: SIZE, position: 'relative' },
  centerText: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCount: { color: G.text, fontSize: 24, fontFamily: FONTS.extraBold },
  centerLabel: {
    color: G.muted,
    fontSize: 9,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  legend: { flex: 1, gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: G.sub, fontSize: 13, fontFamily: FONTS.medium, flex: 1 },
  legendPct: { color: G.text, fontSize: 13, fontFamily: FONTS.bold },
});
