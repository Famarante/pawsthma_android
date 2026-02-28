import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { G } from '../../constants/colors';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1220',
          borderTopColor: G.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: G.amber,
        tabBarInactiveTintColor: G.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>◈</Text>,
        }}
      />
      <Tabs.Screen
        name="attacks"
        options={{
          title: t('tabs.attacks'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>⟁</Text>,
        }}
      />
      <Tabs.Screen
        name="inhaler"
        options={{
          title: t('tabs.inhaler'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>◎</Text>,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: t('tabs.insights'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>◉</Text>,
        }}
      />
    </Tabs>
  );
}
