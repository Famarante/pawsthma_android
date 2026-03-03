import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/appStore';
import { G, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'home',
  attacks: 'history',
  inhaler: 'medication',
  insights: 'insights',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const setModal = useAppStore((s) => s.setModal);

  const leftTabs = state.routes.slice(0, 2);
  const rightTabs = state.routes.slice(2, 4);

  const renderTab = (route: typeof state.routes[number], index: number) => {
    const { options } = descriptors[route.key];
    const label = (options.title ?? route.name) as string;
    const isFocused = state.index === index;
    const icon = TAB_ICONS[route.name] || 'circle';
    const color = isFocused ? G.mint : G.sub;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        style={styles.tab}
      >
        <MaterialIcons name={icon} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {leftTabs.map((route, i) => renderTab(route, i))}

        <View style={styles.fabSlot}>
          <TouchableOpacity
            style={[styles.fab, SHADOWS.mint]}
            onPress={() => setModal('chooser')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {rightTabs.map((route, i) => renderTab(route, i + 2))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  fabSlot: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: G.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
});
