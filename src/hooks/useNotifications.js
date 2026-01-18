import { useEffect, useState } from 'react';
import NotificationService from '../services/NotificationService';
import { subscribeToTopic, unsubscribeFromTopic } from '../utils/NotificationUtils';

/**
 * Custom hook for managing notifications
 * Note: NotificationService.initialize() is called in App.tsx to avoid duplication
 */
export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Get token from service (service is initialized in App.tsx)
    const getToken = async () => {
      try {
        const token = await NotificationService.getToken();
        if (token) {
          setFcmToken(token);
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    };

    // Listen for token refresh
    const unsubscribe = NotificationService.addTokenRefreshCallback((newToken) => {
      setFcmToken(newToken);
    });

    getToken();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const subscribe = async (topic) => {
    return await subscribeToTopic(topic);
  };

  const unsubscribe = async (topic) => {
    return await unsubscribeFromTopic(topic);
  };

  return {
    fcmToken,
    subscribe,
    unsubscribe,
  };
};

export default useNotifications;
