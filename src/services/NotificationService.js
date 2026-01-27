import { getApp } from '@react-native-firebase/app';
import { 
  getMessaging, 
  requestPermission as requestMessagingPermission,
  AuthorizationStatus,
  onTokenRefresh,
  onMessage,
  getInitialNotification,
  onNotificationOpenedApp,
  getToken,
  deleteToken
} from '@react-native-firebase/messaging';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { waitForFirebase } from '../utils/FirebaseUtils';

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.messageListener = null;
    this.tokenRefreshListener = null;
    this.tokenRefreshCallbacks = [];
    this.deviceId = null;
    this.app = null;
    this.messaging = null;
    this.firestore = null;
  }

  // Initialize Firebase instances
  _initFirebase() {
    if (!this.app) {
      this.app = getApp();
      this.messaging = getMessaging(this.app);
      this.firestore = getFirestore(this.app);
    }
    return { app: this.app, messaging: this.messaging, firestore: this.firestore };
  }

  // Request notification permissions
  async requestPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs access to send you notifications',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    } else {
      // iOS - try to use Firebase messaging directly
      try {
        const { messaging } = this._initFirebase();
        const authStatus = await requestMessagingPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;
        return enabled;
      } catch (error) {
        const errorMsg = error?.message || String(error);
        
        // If Firebase isn't initialized, wait and retry
        if (errorMsg.includes('No Firebase App') || errorMsg.includes('has been created')) {
          console.log('Firebase not ready for requestPermission, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const { messaging } = this._initFirebase();
            const authStatus = await requestMessagingPermission(messaging);
            const enabled =
              authStatus === AuthorizationStatus.AUTHORIZED ||
              authStatus === AuthorizationStatus.PROVISIONAL;
            return enabled;
          } catch (retryError) {
            console.error('Error requesting permission after retry:', retryError?.message);
            return false;
          }
        }
        
        console.error('Error requesting permission:', errorMsg);
        return false;
      }
    }
  }

  // Register device for remote messages (iOS only) - internal helper
  // Note: Auto-registration is enabled by default in React Native Firebase
  // This method is kept for compatibility but does nothing when auto-registration is enabled
  async _registerDeviceIfNeeded() {
    if (Platform.OS !== 'ios') return true;
    
    // Auto-registration is enabled by default, so no manual registration needed
    // Only call registerDeviceForRemoteMessages if auto-registration is disabled
    // in firebase.json via 'messaging_ios_auto_register_for_remote_messages: false'
    // For now, we skip manual registration since it's not required
    return true;
  }

  // Get FCM token
  async getToken() {
    try {
      // Register device on iOS if needed
      await this._registerDeviceIfNeeded();
      
      if (!this.fcmToken) {
        const { messaging } = this._initFirebase();
        this.fcmToken = await getToken(messaging);
      }
      return this.fcmToken;
    } catch (error) {
      const errorMsg = error?.message || String(error);
      
      // Handle iOS registration requirement
      if (errorMsg.includes('must be registered') || errorMsg.includes('registerDeviceForRemoteMessages')) {
        if (await this._registerDeviceIfNeeded()) {
          try {
            const { messaging } = this._initFirebase();
            this.fcmToken = await getToken(messaging);
            return this.fcmToken;
          } catch (retryError) {
            console.error('Error getting FCM token after registration:', retryError?.message);
            return null;
          }
        }
        return null;
      }
      
      // If Firebase isn't initialized, wait and retry once
      if (errorMsg.includes('No Firebase App') || errorMsg.includes('has been created')) {
        console.log('Firebase not ready for getToken, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          await this._registerDeviceIfNeeded();
          const { messaging } = this._initFirebase();
          this.fcmToken = await getToken(messaging);
          return this.fcmToken;
        } catch (retryError) {
          console.error('Error getting FCM token after retry:', retryError?.message);
          return null;
        }
      }
      
      console.error('Error getting FCM token:', errorMsg);
      return null;
    }
  }

  // Initialize notification service
  async initialize(userInfo = {}) {
    try {
      // Try to wait for Firebase, but don't block if it takes too long
      // Firebase should auto-initialize, so we'll try to use it directly
      const isReady = await Promise.race([
        waitForFirebase(),
        new Promise(resolve => setTimeout(() => resolve(false), 3000)) // Timeout after 3 seconds
      ]);
      
      if (!isReady) {
        console.warn('Firebase initialization check timed out, attempting to use Firebase anyway...');
      } else {
        console.log('Firebase is ready, initializing notifications...');
      }
      
      // Initialize device ID
      await this.initializeDeviceId();
      
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Register device for remote messages (iOS only, required before getToken)
      await this._registerDeviceIfNeeded();

      // Get FCM token (this will fail if Firebase isn't ready, but we'll catch it)
      try {
        const token = await this.getToken();
        if (token) {
          console.log('FCM Token:', token);
          // Save token to Firestore when app opens (with user info if available)
          await this.onTokenReceived(token, userInfo);
        }
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError.message);
        // Don't fail completely, just log the error
        return false;
      }

      // Initialize Firebase instances
      const { messaging } = this._initFirebase();

      // Listen for token refresh
      this.tokenRefreshListener = onTokenRefresh(messaging, async (newToken) => {
        console.log('FCM Token refreshed:', newToken);
        this.fcmToken = newToken;
        await this.onTokenReceived(newToken);
        // Notify listeners
        if (this.tokenRefreshCallbacks) {
          this.tokenRefreshCallbacks.forEach(callback => callback(newToken));
        }
      });

      // Handle foreground messages
      this.messageListener = onMessage(messaging, async (remoteMessage) => {
        console.log('Foreground message received:', remoteMessage);
        this.handleForegroundMessage(remoteMessage);
      });

      // Background message handler is set in App.tsx to avoid duplication

      // Handle notification opened (app was in background/quit state)
      getInitialNotification(messaging)
        .then((remoteMessage) => {
          if (remoteMessage) {
            console.log('Notification opened app from quit state:', remoteMessage);
            this.handleNotificationOpened(remoteMessage);
          }
        });

      // Handle notification opened (app was in background)
      onNotificationOpenedApp(messaging, (remoteMessage) => {
        console.log('Notification opened app from background:', remoteMessage);
        this.handleNotificationOpened(remoteMessage);
      });

      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  // Handle foreground messages
  handleForegroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Show alert for foreground notifications
      Alert.alert(
        notification.title || 'Notification',
        notification.body || 'You have a new message',
        [
          {
            text: 'OK',
            onPress: () => {
              if (data) {
                this.handleNotificationData(data);
              }
            },
          },
        ]
      );
    }
  }

  // Handle notification data when opened
  handleNotificationOpened(remoteMessage) {
    const { data } = remoteMessage;
    if (data) {
      this.handleNotificationData(data);
    }
  }

  // Handle notification data
  handleNotificationData(data) {
    // Handle different types of notification data
    if (data.type === 'navigate') {
      // Navigate to specific screen
      // You can use navigation here if needed
      console.log('Navigate to:', data.screen);
      // Emit event for navigation if using event emitter
      this.emitNavigationEvent(data.screen, data);
    } else if (data.url) {
      // Open URL in WebView
      console.log('Open URL:', data.url);
      this.emitUrlEvent(data.url, data);
    } else if (data.shopifyUrl) {
      // Handle Shopify-specific URLs
      console.log('Open Shopify URL:', data.shopifyUrl);
      this.emitUrlEvent(data.shopifyUrl, data);
    }
    // Add more handlers as needed
  }

  // Emit navigation event (can be used with EventEmitter or navigation)
  emitNavigationEvent(screen, data) {
    // You can use React Navigation or EventEmitter here
    // For now, we'll use a callback that can be set
    if (this.onNavigate) {
      this.onNavigate(screen, data);
    }
  }

  // Emit URL event for WebView
  emitUrlEvent(url, data) {
    if (this.onUrlOpen) {
      this.onUrlOpen(url, data);
    }
  }

  // Set navigation callback
  setNavigationCallback(callback) {
    this.onNavigate = callback;
  }

  // Set URL open callback
  setUrlOpenCallback(callback) {
    this.onUrlOpen = callback;
  }

  // Save FCM token to Firestore
  async saveTokenToFirestore(token, userInfo = {}) {
    try {
      const { firestore } = this._initFirebase();
      
      // Get device ID (you can use react-native-device-info for better device identification)
      const deviceId = this.deviceId || Platform.OS;
      const timestamp = serverTimestamp();
      
      const tokenData = {
        fcmToken: token,
        platform: Platform.OS,
        deviceId: deviceId,
        appVersion: '0.0.1', // You can get this from package.json or device info
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
        ...userInfo, // Include any user info like userId, email, etc.
      };

      // Save to Firestore collection 'fcm_tokens'
      // Using deviceId as document ID to avoid duplicates
      const docRef = doc(collection(firestore, 'fcm_tokens'), deviceId);
      
      await setDoc(docRef, tokenData, { merge: true });
      
      console.log('FCM token saved to Firestore:', deviceId);
      return true;
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
      return false;
    }
  }

  // Update user info for existing token
  async updateUserInfo(userInfo) {
    try {
      if (!this.fcmToken) {
        console.warn('No FCM token available to update');
        return false;
      }

      const { firestore } = this._initFirebase();
      const deviceId = this.deviceId || Platform.OS;
      const docRef = doc(collection(firestore, 'fcm_tokens'), deviceId);
      
      await updateDoc(docRef, {
        ...userInfo,
        updatedAt: serverTimestamp(),
      });
      
      console.log('User info updated in Firestore');
      return true;
    } catch (error) {
      console.error('Error updating user info:', error);
      return false;
    }
  }

  // Delete token from Firestore (on logout)
  async deleteTokenFromFirestore() {
    try {
      const { firestore } = this._initFirebase();
      const deviceId = this.deviceId || Platform.OS;
      const docRef = doc(collection(firestore, 'fcm_tokens'), deviceId);
      
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      
      console.log('FCM token deactivated in Firestore');
      return true;
    } catch (error) {
      console.error('Error deleting token from Firestore:', error);
      return false;
    }
  }

  // Callback when token is received
  async onTokenReceived(token, userInfo = {}) {
    console.log('FCM Token received:', token);
    
    // Save token to Firestore
    await this.saveTokenToFirestore(token, userInfo);
    
    // You can also send to your Shopify backend if needed
    // await this.sendTokenToShopify(token);
  }

  // Delete token (for logout)
  async deleteToken() {
    try {
      // Deactivate in Firestore first
      await this.deleteTokenFromFirestore();
      
      // Then delete from FCM
      const { messaging } = this._initFirebase();
      await deleteToken(messaging);
      this.fcmToken = null;
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  // Initialize device ID
  async initializeDeviceId() {
    try {
      // Use react-native-device-info for device identification
      const DeviceInfo = require('react-native-device-info');
      this.deviceId = await DeviceInfo.getUniqueId();
    } catch (error) {
      // Fallback to platform + timestamp
      this.deviceId = `${Platform.OS}_${Date.now()}`;
      console.warn('Could not get device ID, using fallback:', this.deviceId);
    }
  }

  // Add token refresh callback
  addTokenRefreshCallback(callback) {
    if (!this.tokenRefreshCallbacks) {
      this.tokenRefreshCallbacks = [];
    }
    this.tokenRefreshCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.tokenRefreshCallbacks = this.tokenRefreshCallbacks.filter(cb => cb !== callback);
    };
  }

  // Cleanup listeners
  cleanup() {
    if (this.messageListener) {
      this.messageListener();
      this.messageListener = null;
    }
    if (this.tokenRefreshListener) {
      this.tokenRefreshListener();
      this.tokenRefreshListener = null;
    }
  }
}

export default new NotificationService();
