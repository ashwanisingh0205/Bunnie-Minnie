import React, { useEffect } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getMessaging } from '@react-native-firebase/messaging';
import Navigation from './src/navigation/Navigation';
import NotificationService from './src/services/NotificationService';
import { waitForFirebase } from './src/utils/FirebaseUtils';
import { navigationRef } from './src/utils/NavigationUtils';

// Set background message handler (must be set before app initialization)
// In React Native Firebase modular API, setBackgroundMessageHandler is a method on the messaging instance
const app = getApp();
const messaging = getMessaging(app);
messaging.setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
});

const App = () => {
  useEffect(() => {

    const initNotifications = async () => {
      try {
        // Wait for Firebase initialization (with timeout)
        const isReady = await Promise.race([
          waitForFirebase(),
          new Promise(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        
        if (!isReady) {
          console.warn('Firebase initialization check timed out, continuing anyway...');
        }

        // Set up navigation callbacks for notifications
        NotificationService.setNavigationCallback((screen, data) => {
          if (navigationRef.isReady()) {
            navigationRef.navigate(screen, data);
          }
        });

        NotificationService.setUrlOpenCallback((url, data) => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('WebViewScreen', { url, ...data });
          }
        });

        // Initialize notification service
        await NotificationService.initialize();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initNotifications();

    return () => {
      NotificationService.cleanup();
    };
  }, []);

  return <Navigation />;
};

export default App;