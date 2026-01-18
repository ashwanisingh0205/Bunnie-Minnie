# Firebase Cloud Messaging (FCM) Notification Setup

This document explains how the notification system is set up and how to use it.

## Setup Complete ✅

The following components have been implemented:

1. **NotificationService.js** - Main service for handling notifications
2. **CustomFirebaseMessagingService.kt** - Android native service for handling FCM messages
3. **useNotifications.js** - React hook for easy notification management
4. **NotificationUtils.js** - Utility functions for notifications

## Configuration

### Android Configuration
- ✅ `google-services.json` is configured
- ✅ Firebase dependencies are installed
- ✅ Notification permissions are added to AndroidManifest.xml
- ✅ Custom Firebase Messaging Service is registered
- ✅ Notification channel is created

## Usage

### Basic Usage in Components

```javascript
import { useNotifications } from '../hooks/useNotifications';

const MyComponent = () => {
  const { fcmToken, isInitialized, hasPermission, subscribe, unsubscribe } = useNotifications();

  useEffect(() => {
    if (isInitialized && fcmToken) {
      console.log('FCM Token:', fcmToken);
      // Send this token to your backend server
      
      // Subscribe to a topic (optional)
      subscribe('news');
    }
  }, [isInitialized, fcmToken]);

  return (
    // Your component JSX
  );
};
```

### Manual Usage

```javascript
import NotificationService from '../services/NotificationService';

// Initialize notifications
await NotificationService.initialize();

// Get FCM token
const token = await NotificationService.getToken();
console.log('FCM Token:', token);

// Send token to your backend
// await fetch('YOUR_API_ENDPOINT', {
//   method: 'POST',
//   body: JSON.stringify({ token })
// });
```

## Sending Test Notifications

### Using Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select your Android app
5. Click "Send test message"
6. Enter the FCM token from your app logs
7. Send the message

### Using cURL

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/bunnie-57921/messages:send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "YOUR_FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test message"
      },
      "data": {
        "type": "navigate",
        "screen": "HomeScreen"
      }
    }
  }'
```

## Notification Handling

### Foreground Notifications
When the app is in the foreground, notifications are displayed as alerts.

### Background Notifications
When the app is in the background, notifications are handled by the native service and displayed as system notifications.

### Notification Data
You can include custom data in notifications:

```json
{
  "notification": {
    "title": "New Order",
    "body": "You have a new order"
  },
  "data": {
    "type": "navigate",
    "screen": "OrderScreen",
    "orderId": "12345"
  }
}
```

## Topics

You can subscribe users to topics for targeted messaging:

```javascript
import { subscribeToTopic, unsubscribeFromTopic } from '../utils/NotificationUtils';

// Subscribe
await subscribeToTopic('promotions');

// Unsubscribe
await unsubscribeFromTopic('promotions');
```

## Important Notes

1. **FCM Token**: The token is generated when the app first launches. Store this token on your backend server.

2. **Token Refresh**: The token may refresh. Listen to token refresh events in NotificationService.

3. **Permissions**: Android 13+ requires runtime permission for notifications. The service handles this automatically.

4. **Notification Channel**: A default notification channel is created for Android 8.0+.

5. **Testing**: Make sure your device/emulator has Google Play Services installed for FCM to work.

## Troubleshooting

### Notifications not received
- Check if FCM token is generated (check logs)
- Verify `google-services.json` is correct
- Ensure device has internet connection
- Check Firebase Console for delivery status

### Permission denied
- Android 13+: Check if POST_NOTIFICATIONS permission is granted
- Check app settings → Notifications

### Token not generated
- Verify Firebase is properly initialized
- Check if Google Play Services is available
- Review logs for errors

## Next Steps

1. **Backend Integration**: Set up your backend to send notifications using FCM Admin SDK
2. **Custom Notification Icons**: Replace the default notification icon in `CustomFirebaseMessagingService.kt`
3. **Deep Linking**: Implement deep linking based on notification data
4. **Notification Actions**: Add action buttons to notifications
