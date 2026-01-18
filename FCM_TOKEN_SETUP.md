# FCM Token Storage & Notification System Setup

## Overview
This implementation automatically stores FCM tokens in Firebase Firestore when users open your app, and provides full notification functionality with deep linking support for your Shopify WebView app.

## Features Implemented

### 1. **Automatic FCM Token Storage**
- ✅ Tokens are automatically saved to Firestore when app opens
- ✅ Tokens are updated when refreshed
- ✅ Device information is stored with each token
- ✅ User information can be linked to tokens

### 2. **WebView Integration**
- ✅ FCM token is automatically injected into Shopify WebView
- ✅ Token is available via `window.ReactNativeFCMToken`
- ✅ Token is stored in `localStorage` for Shopify access
- ✅ Custom event `fcmTokenReceived` is dispatched

### 3. **Notification Actions**
- ✅ Foreground notifications (app is open)
- ✅ Background notifications (app in background)
- ✅ Quit state notifications (app closed)
- ✅ Deep linking to specific URLs
- ✅ Navigation to specific screens

### 4. **Two-Way Communication**
- ✅ React Native → Shopify: FCM token injection
- ✅ Shopify → React Native: User login/logout events
- ✅ Shopify can request FCM token on demand

## Firebase Firestore Structure

### Collection: `fcm_tokens`
Each document uses `deviceId` as the document ID:

```javascript
{
  fcmToken: "string",
  platform: "ios" | "android",
  deviceId: "unique-device-id",
  appVersion: "0.0.1",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true,
  userId: "optional-user-id",      // Added when user logs in
  email: "optional-email",         // Added when user logs in
  userName: "optional-username"    // Added when user logs in
}
```

## How It Works

### 1. App Opens
1. User opens the app
2. Notification permission is requested
3. FCM token is generated
4. Token is automatically saved to Firestore
5. Token is injected into WebView for Shopify

### 2. User Logs In (Shopify)
When user logs in through Shopify WebView, Shopify can send a message:

```javascript
// From Shopify WebView
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'userLoggedIn',
  userId: 'user123',
  email: 'user@example.com',
  userName: 'John Doe'
}));
```

This will update the Firestore document with user information.

### 3. User Logs Out (Shopify)
When user logs out:

```javascript
// From Shopify WebView
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'userLoggedOut'
}));
```

This will deactivate the token in Firestore.

### 4. Notification Received
When a notification is received:
- **Foreground**: Shows alert, handles data
- **Background**: Handles data, can navigate
- **Quit State**: Handles data when app opens

### 5. Notification Opened
When user taps a notification:
- Extracts URL or screen from notification data
- Navigates to WebViewScreen with the URL
- WebView loads the specified page

## Shopify Integration

### Accessing FCM Token in Shopify

#### Method 1: Direct Access
```javascript
// In your Shopify theme or app
const fcmToken = window.ReactNativeFCMToken;
console.log('FCM Token:', fcmToken);
```

#### Method 2: Event Listener
```javascript
// Listen for token
window.addEventListener('fcmTokenReceived', (event) => {
  const token = event.detail.token;
  console.log('FCM Token received:', token);
  
  // Send to your Shopify backend
  fetch('/apps/your-app/api/save-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
});
```

#### Method 3: localStorage
```javascript
// Get from localStorage
const fcmToken = localStorage.getItem('fcmToken');
```

#### Method 4: Request Token
```javascript
// Request token from React Native
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'requestFCMToken'
}));

// Listen for response (you'll need to add this handler in Shopify)
```

### Sending User Info to React Native

```javascript
// When user logs in
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'userLoggedIn',
  userId: '{{ customer.id }}',
  email: '{{ customer.email }}',
  userName: '{{ customer.name }}'
}));

// When user logs out
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'userLoggedOut'
}));
```

## Sending Notifications

### From Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Create a new notification
3. Add notification data:
   ```json
   {
     "url": "https://bunnieandminnie.com/products/123",
     "type": "product",
     "productId": "123"
   }
   ```

### From Your Backend
```javascript
// Example: Node.js with Firebase Admin SDK
const admin = require('firebase-admin');

// Get all active tokens from Firestore
const tokensSnapshot = await admin.firestore()
  .collection('fcm_tokens')
  .where('isActive', '==', true)
  .get();

const tokens = tokensSnapshot.docs.map(doc => doc.data().fcmToken);

// Send notification
const message = {
  notification: {
    title: 'New Product Available!',
    body: 'Check out our latest product'
  },
  data: {
    url: 'https://bunnieandminnie.com/products/123',
    type: 'product',
    productId: '123'
  },
  tokens: tokens
};

await admin.messaging().sendEachForMulticast(message);
```

### Notification Data Format
```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text"
  },
  "data": {
    "url": "https://bunnieandminnie.com/path",  // URL to open in WebView
    "type": "navigate",                          // Optional: navigation type
    "screen": "ProductScreen",                   // Optional: screen name
    "shopifyUrl": "https://bunnieandminnie.com/products/123"  // Alternative URL field
  }
}
```

## Testing

### 1. Test Token Storage
1. Open the app
2. Check Firebase Console → Firestore
3. Verify token is saved in `fcm_tokens` collection

### 2. Test WebView Integration
1. Open app and navigate to WebView
2. Open browser console in WebView (if possible)
3. Check: `window.ReactNativeFCMToken` should be available
4. Check: `localStorage.getItem('fcmToken')` should return token

### 3. Test Notifications
1. Send test notification from Firebase Console
2. Test foreground (app open)
3. Test background (app in background)
4. Test quit state (app closed)

### 4. Test Deep Linking
1. Send notification with `url` in data
2. Tap notification
3. Verify WebView opens the URL

## Firebase Security Rules

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fcm_tokens/{deviceId} {
      // Allow read/write for authenticated users only
      // Or adjust based on your security needs
      allow read, write: if request.auth != null;
      
      // Or allow public write (less secure, but works for mobile apps)
      // allow write: if true;
      // allow read: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Token not saving to Firestore
- Check Firebase configuration files are correct
- Check Firestore is enabled in Firebase Console
- Check security rules allow writes
- Check device has internet connection

### Token not injected into WebView
- Verify WebView has loaded completely
- Check JavaScript is enabled
- Verify token is available before injection

### Notifications not working
- Check notification permissions are granted
- Verify FCM token is valid
- Check notification payload format
- Verify Firebase configuration

### Deep linking not working
- Check notification data contains `url` field
- Verify navigation is set up correctly
- Check WebViewScreen route exists

## Next Steps

1. **Set up Firebase Security Rules** for Firestore
2. **Create Shopify backend endpoint** to receive FCM tokens
3. **Set up notification sending service** (Firebase Functions or your backend)
4. **Test on both iOS and Android**
5. **Add analytics** to track notification engagement

## Files Modified

- `src/services/NotificationService.js` - Main notification service with Firestore integration
- `src/screens/WebViewScreen.js` - WebView with FCM token injection
- `App.tsx` - App initialization with notification setup
- `src/navigation/Navigation.js` - Added WebViewScreen route
- `package.json` - Added @react-native-firebase/firestore and react-native-device-info

## Dependencies Added

- `@react-native-firebase/firestore@23.7.0`
- `react-native-device-info`

Make sure to run `pod install` in the `ios` directory after adding these dependencies.
