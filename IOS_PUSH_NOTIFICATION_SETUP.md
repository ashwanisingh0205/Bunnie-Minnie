# iOS Push Notification Setup

## ✅ What Was Fixed

The error `no valid "aps-environment" entitlement string found` has been resolved by:

1. **Created entitlements file**: `ios/MyApp/MyApp.entitlements`
   - Contains `aps-environment` set to `development` for testing
   - For production, change to `production`

2. **Updated Xcode project**: Added the entitlements file reference to the project

## 🔧 Next Steps

### 1. Rebuild the iOS App
The entitlements file is now configured, but you need to rebuild:

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

Or open in Xcode and build:
```bash
open ios/MyApp.xcworkspace
```

### 2. Verify in Xcode (Recommended)
1. Open `ios/MyApp.xcworkspace` in Xcode
2. Select your project in the navigator
3. Select the **MyApp** target
4. Go to **Signing & Capabilities** tab
5. Verify that **Push Notifications** capability is enabled
   - If not, click **+ Capability** and add **Push Notifications**
6. Verify the entitlements file is listed under **Code Signing Entitlements**

### 3. For Production Builds
When you're ready to deploy to production:

1. **Update entitlements file** (`ios/MyApp/MyApp.entitlements`):
   ```xml
   <key>aps-environment</key>
   <string>production</string>
   ```

2. **Ensure your Apple Developer account has Push Notifications enabled**:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Select your App ID (`com.ashwani.bunie`)
   - Enable **Push Notifications** capability
   - Regenerate your provisioning profiles

3. **Update provisioning profiles** in Xcode:
   - Xcode → Preferences → Accounts
   - Select your team
   - Download all profiles

## 📱 Testing

After rebuilding, you should see:
- ✅ "Device registered for remote messages (iOS)"
- ✅ "FCM Token: [your-token]"
- ✅ "FCM token saved to Firestore"

## ⚠️ Important Notes

- **Development vs Production**: 
  - `development` - For testing with development certificates
  - `production` - For App Store and TestFlight builds
  
- **Provisioning Profile**: Your provisioning profile must have Push Notifications enabled. Xcode will automatically manage this if you have the capability enabled.

- **APNs Certificate**: Make sure your Firebase project has the correct APNs certificate configured:
  - Development: Use development APNs certificate
  - Production: Use production APNs certificate

## 🐛 Troubleshooting

If you still see the error after rebuilding:

1. **Clean build folder**:
   ```bash
   cd ios
   rm -rf build
   rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*
   pod install
   ```

2. **Verify entitlements in Xcode**:
   - Open the project in Xcode
   - Check that `CODE_SIGN_ENTITLEMENTS` is set in Build Settings
   - Verify the file path is correct

3. **Check provisioning profile**:
   - Ensure your provisioning profile includes Push Notifications
   - Regenerate if needed

4. **Verify Firebase APNs configuration**:
   - Check Firebase Console → Project Settings → Cloud Messaging
   - Ensure APNs certificate/key is uploaded
