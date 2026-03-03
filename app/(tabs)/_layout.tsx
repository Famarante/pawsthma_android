import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CustomTabBar } from '../../components/CustomTabBar';
import { ActionChooserModal } from '../../components/modals/ActionChooserModal';
import { AttackModal } from '../../components/modals/AttackModal';
import { InhalerModal } from '../../components/modals/InhalerModal';
import { ProfileManager } from '../../components/ProfileManager';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
        <Tabs.Screen name="attacks" options={{ title: t('tabs.attacks') }} />
        <Tabs.Screen name="inhaler" options={{ title: t('tabs.inhaler') }} />
        <Tabs.Screen name="insights" options={{ title: t('tabs.insights') }} />
      </Tabs>
      <ActionChooserModal />
      <AttackModal />
      <InhalerModal />
      <ProfileManager />
    </>
  );
}
