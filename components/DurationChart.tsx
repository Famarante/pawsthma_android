import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { G } from '../constants/colors';

const W = Dimensions.get('window').width - 64;
const CHART_H = 120;

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
        <Text style={{ color: G.muted, fontSize: 13 }}>No data yet</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.duration), 0.1);
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: CHART_H - (d.duration / maxVal) * CHART_H,
    label: d.date,
    value: d.duration,
  }));

  // Build SVG polyline path
  const pathData = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View>
      {/* Simple line chart using absolute positioned dots */}
      <View style={{ height: CHART_H, position: 'relative' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <View
            key={frac}
            style={{
              position: 'absolute',
              top: frac * CHART_H,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />
        ))}

        {/* Dots */}
        {pts.map((p, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: p.x - 4,
                top: p.y - 4,
              },
            ]}
          />
        ))}
      </View>

      {/* X axis labels (first and last) */}
      {pts.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
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
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: G.amber,
  },
  axisLabel: { color: G.muted, fontSize: 9 },
});
