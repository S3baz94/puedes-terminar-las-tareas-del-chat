import { getFirebaseMessaging } from './firebase';

export async function requestPushNotifications() {
  const messaging = await getFirebaseMessaging();

  if (!messaging || !('Notification' in window)) {
    return { enabled: false, reason: 'FCM no configurado para este prototipo.' };
  }

  const permission = await Notification.requestPermission();
  return { enabled: permission === 'granted', reason: permission };
}
