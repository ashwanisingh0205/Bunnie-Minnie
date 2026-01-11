import { StyleSheet, View, StatusBar, Platform } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const CustomHeader = ({ children, backgroundColor = '#fff7f0' }) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <SafeAreaView 
        style={[styles.headerContainer, { backgroundColor }]} 
        edges={['top']}
      >
        <View style={styles.headerContent}>
          {children}
        </View>
      </SafeAreaView>
    </>
  )
}

export default CustomHeader

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 101, 128, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
