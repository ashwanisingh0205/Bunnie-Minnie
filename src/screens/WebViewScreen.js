import { StyleSheet, ActivityIndicator, View, StatusBar, Text } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import BottomNavigation from '../components/BottomNavigation'

const WebViewScreen = ({ route }) => {
  const [loading, setLoading] = useState(true)
  const { url } = route.params || { url: 'https://bunnieandminnie.com/' }
  
  // Determine header title based on screen
  const getHeaderTitle = () => {
    if (url.includes('login') || url.includes('authentication')) {
      return 'Login'
    }
    if (url.includes('contact')) {
      return 'Contact Us'
    }
    return 'Bunnie&Minnie'
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#c96580"
        translucent={false}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>
      <WebView
        key={url}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
  header: {
    backgroundColor: '#c96580',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#c96580',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
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
