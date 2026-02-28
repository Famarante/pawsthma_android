import { View, Text, StyleSheet } from 'react-native';
import { Profile } from '../types';

interface Props {
  addedBy: string;
  profiles: Profile[];
}

export function WhoBadge({ addedBy, profiles }: Props) {
  const p = profiles.find((x) => x.id === addedBy);
  if (!p) return null;

  return (
    <View style={[styles.badge, { backgroundColor: `${p.color}18` }]}>
      <Text style={[styles.text, { color: p.color }]}>
        {p.emoji} {p.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexShrink: 0,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
  },
});
