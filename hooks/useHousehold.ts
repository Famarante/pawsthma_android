import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { Cat, Household, Profile } from '../types';
import { PCOLS } from '../constants/colors';
import { daysBetween, today } from '../utils/data';

export function useHousehold() {
  const data = useAppStore((s) => s.data);
  const catId = useAppStore((s) => s.catId);
  const user = useAuthStore((s) => s.user);
  const uid = useAuthStore((s) => s.uid);
  const activeHome = useAuthStore((s) => s.activeHome);

  return useMemo(() => {
    const homes = data?.households || {};
    const homeKeys = Object.keys(homes);
    const homeKey = activeHome && homes[activeHome] ? activeHome : homeKeys[0] || null;
    const currentHome: Household | null = homeKey ? homes[homeKey] : null;

    const cats: Cat[] = currentHome?.cats || [];
    const currentCat = cats.find((c) => c.id === catId) || null;

    const profilesRaw = currentHome?.profiles;
    const authProfile: Profile = {
      id: user?.uid || 'anon',
      name: user?.displayName || user?.email?.split('@')[0] || 'User',
      emoji: '🧑',
      color: PCOLS[0],
    };
    const profiles: Profile[] = Array.isArray(profilesRaw)
      ? profilesRaw
      : user?.uid
        ? [authProfile]
        : [];

    const me = profiles.find((p) => p.id === uid) || authProfile;
    const others = profiles.filter((p) => p.id !== uid);

    const attacks = Array.isArray(currentCat?.attacks) ? currentCat!.attacks : [];
    const inhalerLogs = Array.isArray(currentCat?.inhalerLogs) ? currentCat!.inhalerLogs : [];

    const ds = currentCat
      ? daysBetween(currentCat.inhalerInfo.lastCleaned, today())
      : 0;
    const overdue = currentCat ? ds >= currentCat.inhalerInfo.cleaningIntervalDays : false;
    const soon = !overdue && currentCat ? ds >= currentCat.inhalerInfo.cleaningIntervalDays - 3 : false;

    return {
      homeKey,
      currentHome,
      cats,
      currentCat,
      catId,
      profiles,
      me,
      others,
      attacks,
      inhalerLogs,
      ds,
      overdue,
      soon,
    };
  }, [data, catId, user, uid, activeHome]);
}
