import { useAppStore } from '../store/appStore';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const notificationsState = useAppStore((state) => state.notifications);
  const notifications = notificationsState.filter((item) => item.userId === user?.uid);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
  };
}
