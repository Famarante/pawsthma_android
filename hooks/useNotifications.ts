import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { fbSaveFcmToken } from '../services/firebase';
import { useHousehold } from './useHousehold';
import { daysBetween, today } from '../utils/data';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pawsthma', {
      name: 'Pawsthma Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

const CLEANING_NOTIF_ID = 'inhaler-cleaning';

export function useNotifications() {
  const { currentCat } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const hasRegistered = useRef(false);

  // Register for push on mount
  useEffect(() => {
    if (hasRegistered.current) return;
    hasRegistered.current = true;

    registerForPushNotificationsAsync().then(async (token) => {
      if (token && user?.uid) {
        await fbSaveFcmToken(user.uid, token).catch(() => null);
      }
    });
  }, [user?.uid]);

  // Schedule/cancel inhaler cleaning notification based on current cat
  useEffect(() => {
    if (!currentCat) return;

    const { inhalerInfo } = currentCat;
    const ds = daysBetween(inhalerInfo.lastCleaned, today());
    const daysUntilClean = inhalerInfo.cleaningIntervalDays - ds;

    // Cancel existing
    Notifications.cancelScheduledNotificationAsync(CLEANING_NOTIF_ID).catch(() => null);

    if (daysUntilClean <= 0) {
      // Overdue: send immediately
      Notifications.scheduleNotificationAsync({
        identifier: CLEANING_NOTIF_ID,
        content: {
          title: 'Inhaler Overdue!',
          body: `${currentCat.name}'s inhaler is overdue for cleaning.`,
          data: { type: 'cleaning-overdue' },
        },
        trigger: null,
      }).catch(() => null);
    } else if (daysUntilClean === 1) {
      // Due tomorrow: schedule for tomorrow morning
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      Notifications.scheduleNotificationAsync({
        identifier: CLEANING_NOTIF_ID,
        content: {
          title: 'Inhaler Cleaning Reminder',
          body: `Time to clean ${currentCat.name}'s inhaler!`,
          data: { type: 'cleaning-reminder' },
        },
        trigger: { date: tomorrow, channelId: 'pawsthma' },
      }).catch(() => null);
    }
  }, [currentCat?.inhalerInfo?.lastCleaned, currentCat?.inhalerInfo?.cleaningIntervalDays]);
}
