import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Circle } from 'react-native-svg';
import { G } from '../constants/colors';
import { FONTS } from '../constants/fonts';

const W = Dimensions.get('window').width - 64;
const CHART_H = 140;
const PADDING = 8;

interface DataPoint {
  date: string;
  duration: number;
}

interface Props {
  data: DataPoint[];
}

export function DurationChart({ data }: Props) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: G.muted, fontSize: 13, fontFamily: FONTS.regular }}>No data yet</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.duration), 0.1);
  const pts = data.map((d, i) => ({
    x: PADDING + (i / Math.max(data.length - 1, 1)) * (W - PADDING * 2),
    y: PADDING + (1 - d.duration / maxVal) * (CHART_H - PADDING * 2),
    label: d.date,
    value: d.duration,
  }));

  // SVG path
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath +
    ` L${pts[pts.length - 1].x},${CHART_H} L${pts[0].x},${CHART_H} Z`;

  return (
    <View>
      <Svg width={W} height={CHART_H}>
        <Defs>
          <SvgGrad id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={G.primary} stopOpacity={0.20} />
            <Stop offset="1" stopColor={G.primary} stopOpacity={0.02} />
          </SvgGrad>
        </Defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <Path
            key={frac}
            d={`M${PADDING},${PADDING + frac * (CHART_H - PADDING * 2)} L${W - PADDING},${PADDING + frac * (CHART_H - PADDING * 2)}`}
            stroke={G.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={linePath} stroke={G.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={G.primary} stroke="#FFFFFF" strokeWidth={2} />
        ))}
      </Svg>

      {/* X axis labels */}
      {pts.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: PADDING }}>
          <Text style={styles.axisLabel}>{pts[0].label}</Text>
          {pts.length > 1 && (
            <Text style={styles.axisLabel}>{pts[pts.length - 1].label}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: CHART_H, alignItems: 'center', justifyContent: 'center' },
  axisLabel: { color: G.sub, fontSize: 10, fontFamily: FONTS.regular },
});
