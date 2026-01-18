// Use default import for compatibility, but try new API if available
import firebaseApp from '@react-native-firebase/app';

// Try to use new modular API if available
let getApp, getApps;
try {
  const modularApp = require('@react-native-firebase/app');
  getApp = modularApp.getApp || (() => firebaseApp.app());
  getApps = modularApp.getApps || (() => firebaseApp.apps || []);
} catch (e) {
  // Fallback to default API
  getApp = () => firebaseApp.app();
  getApps = () => firebaseApp.apps || [];
}

/**
 * Wait for Firebase to be initialized
 * React Native Firebase auto-initializes from config files,
 * but we need to wait for native modules to be ready
 */
export const waitForFirebase = async (maxAttempts = 20, delay = 500) => {
  console.log('Waiting for Firebase to initialize...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try to access Firebase app
      // This will throw if Firebase is not initialized
      const apps = getApps();
      if (apps && apps.length > 0) {
        const app = getApp();
        console.log('✅ Firebase is ready:', app?.name || '[DEFAULT]');
        return true;
      }
      
      // Alternative: try accessing app directly (for older API)
      try {
        const app = firebaseApp.app();
        if (app) {
          console.log('✅ Firebase is ready (legacy API):', app.name || '[DEFAULT]');
          return true;
        }
      } catch (e) {
        // Not ready yet
      }
      
      // If no apps, wait and retry
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    } catch (error) {
      // Firebase not ready yet
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes('No Firebase App') || errorMsg.includes('has been created')) {
        // Still waiting for initialization - this is expected
        if (i === 0) {
          console.log('Firebase not ready yet, waiting for auto-initialization...');
        }
        
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Different error - might be a real issue
        console.warn(`Firebase check attempt ${i + 1} error:`, errorMsg);
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
  }
  
  // If we get here, Firebase didn't initialize
  console.error('❌ Firebase failed to initialize after', maxAttempts * delay, 'ms');
  console.error('This might indicate:');
  console.error('1. Config files missing: google-services.json (Android) or GoogleService-Info.plist (iOS)');
  console.error('2. Native modules not properly linked');
  console.error('3. App needs to be rebuilt after adding Firebase');
  console.error('4. Bundle ID/Package name mismatch between config files and project');
  
  // Try one more time with a direct access attempt
  try {
    const apps = getApps();
    if (apps && apps.length > 0) {
      const app = getApp();
      console.log('✅ Firebase initialized on final attempt');
      return true;
    }
    
    // Try legacy API
    const app = firebaseApp.app();
    if (app) {
      console.log('✅ Firebase initialized on final attempt (legacy API)');
      return true;
    }
  } catch (finalError) {
    console.error('Final Firebase check failed:', finalError?.message);
    console.error('⚠️  Firebase may not be properly configured. Please:');
    console.error('   1. Rebuild the app: npx react-native run-ios');
    console.error('   2. Verify GoogleService-Info.plist is in ios/ directory');
    console.error('   3. Check bundle ID matches: com.ashwani.bunie');
  }
  
  return false;
};

/**
 * Check if Firebase is initialized
 */
export const isFirebaseReady = () => {
  try {
    const apps = getApps();
    if (apps && apps.length > 0) {
      return true;
    }
    // Try legacy API
    const app = firebaseApp.app();
    return app !== null && app !== undefined;
  } catch (error) {
    return false;
  }
};
