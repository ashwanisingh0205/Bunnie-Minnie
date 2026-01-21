import { StyleSheet, ActivityIndicator, View } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import BottomNavigation from '../components/BottomNavigation';
import NotificationService from '../services/NotificationService';
import { useNotifications } from '../hooks/useNotifications';

const WebViewScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(route?.params?.url || 'https://bunnieandminnie.com/');
  const webViewRef = useRef(null);
  const { fcmToken } = useNotifications();

  // Inject FCM token into WebView - memoized to avoid recreation
  const injectTokenScript = useCallback((token) => {
    if (!token) return '';
    // Escape token to prevent XSS if token contains special characters
    const escapedToken = token.replace(/'/g, "\\'");
    return `
      (function() {
        window.ReactNativeFCMToken = '${escapedToken}';
        window.dispatchEvent(new CustomEvent('fcmTokenReceived', {
          detail: { token: '${escapedToken}' }
        }));
        if (window.localStorage) {
          window.localStorage.setItem('fcmToken', '${escapedToken}');
        }
      })();
      true;
    `;
  }, []);

  // Handle navigation from notifications
  useEffect(() => {
    const urlCallback = (url) => {
      // Update URL state - WebView will re-render with new source due to key prop
      setCurrentUrl(url);
    };
    
    NotificationService.setUrlOpenCallback(urlCallback);
    return () => {
      NotificationService.setUrlOpenCallback(null);
    };
  }, []);

  // Handle messages from WebView (for two-way communication)
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle different message types from Shopify
      if (data.type === 'userLoggedIn') {
        // Update user info in Firestore when user logs in
        NotificationService.updateUserInfo({
          userId: data.userId,
          email: data.email,
          userName: data.userName,
        });
      } else if (data.type === 'userLoggedOut') {
        // Deactivate token when user logs out
        NotificationService.deleteToken();
      } else if (data.type === 'requestFCMToken') {
        // Send FCM token when Shopify requests it
        if (fcmToken && webViewRef.current) {
          const escapedToken = fcmToken.replace(/'/g, "\\'");
          const script = `
            (function() {
              if (window.postMessage) {
                window.postMessage(JSON.stringify({
                  type: 'fcmToken',
                  token: '${escapedToken}'
                }), '*');
              }
            })();
            true;
          `;
          webViewRef.current.injectJavaScript(script);
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <WebView
        ref={webViewRef}
        key={currentUrl}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false);
          // Inject FCM token after page loads (with delay to ensure DOM is ready)
          if (fcmToken && webViewRef.current) {
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(injectTokenScript(fcmToken));
            }, 300);
          }
        }}
        onNavigationStateChange={(navState) => {
          // Update current URL when navigation changes (for internal page navigation)
          if (navState.url !== currentUrl) {
            setCurrentUrl(navState.url);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={handleWebViewMessage}
        injectedJavaScript={`
          window.addEventListener('message', function(event) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
            }
          });
          true;
        `}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c96580" />
        </View>
      )}
      <BottomNavigation />
    </SafeAreaView>
  )
}

export default WebViewScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
 
 
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
})
