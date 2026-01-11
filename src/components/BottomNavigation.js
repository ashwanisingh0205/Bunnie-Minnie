import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { NAVIGATION_CONFIG } from '../config/AppConfig'

const BottomNavigation = () => {
  const navigation = useNavigation()
  const route = useRoute()
  
  // Scale animations for press effect
  const scaleAnims = useRef(
    NAVIGATION_CONFIG.tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(1)
      return acc
    }, {})
  ).current

  // Rotation animations for bounce effect
  const rotationAnims = useRef(
    NAVIGATION_CONFIG.tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(0)
      return acc
    }, {})
  ).current

  // Background opacity animations
  const bgOpacityAnims = useRef(
    NAVIGATION_CONFIG.tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(0)
      return acc
    }, {})
  ).current

  // Active indicator width animations
  const indicatorWidthAnims = useRef(
    NAVIGATION_CONFIG.tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(0)
      return acc
    }, {})
  ).current

  // Pulse animation for active tabs
  const pulseAnims = useRef(
    NAVIGATION_CONFIG.tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(1)
      return acc
    }, {})
  ).current

  // Update animations when route changes
  useEffect(() => {
    NAVIGATION_CONFIG.tabs.forEach((tab) => {
      const isActive = route.name === tab.screenName
      
      // Animate background opacity
      Animated.timing(bgOpacityAnims[tab.id], {
        toValue: isActive ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start()

      // Animate indicator width
      Animated.spring(indicatorWidthAnims[tab.id], {
        toValue: isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start()

      // Pulse animation for active tab
      if (isActive) {
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnims[tab.id], {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnims[tab.id], {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        )
        pulseAnimation.start()
      } else {
        pulseAnims[tab.id].setValue(1)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.name])

  const handleNavigation = (tab) => {
    // Multi-step animation sequence
    Animated.parallel([
      // Scale bounce animation
      Animated.sequence([
        Animated.spring(scaleAnims[tab.id], {
          toValue: 0.75,
          useNativeDriver: true,
          tension: 400,
          friction: 5,
        }),
        Animated.spring(scaleAnims[tab.id], {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.spring(scaleAnims[tab.id], {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 7,
        }),
      ]),
      // Rotation bounce animation
      Animated.sequence([
        Animated.timing(rotationAnims[tab.id], {
          toValue: -15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnims[tab.id], {
          toValue: 15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(rotationAnims[tab.id], {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]),
    ]).start(() => {
      // Reset rotation after animation
      rotationAnims[tab.id].setValue(0)
    })

    // If already on the target screen, replace to force reload
    if (route.name === tab.screenName) {
      navigation.replace(tab.screenName, {
        url: tab.route,
      })
    } else {
      navigation.navigate(tab.screenName, {
        url: tab.route,
      })
    }
  }

  const isActive = (screenName) => {
    return route.name === screenName
  }

  return (
    <View style={styles.container}>
      {NAVIGATION_CONFIG.tabs.map((tab) => {
        const active = isActive(tab.screenName)
        const iconColor = active ? '#c96580' : '#999'
        
        // Animated background color
        const bgColor = bgOpacityAnims[tab.id].interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(255, 245, 248, 0)', 'rgba(255, 245, 248, 1)'],
        })

        // Animated indicator width
        const indicatorWidth = indicatorWidthAnims[tab.id].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 28],
        })

        // Rotation interpolation
        const rotate = rotationAnims[tab.id].interpolate({
          inputRange: [-15, 15],
          outputRange: ['-15deg', '15deg'],
        })

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && styles.activeTab]}
            onPress={() => handleNavigation(tab)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: bgColor,
                  transform: [
                    { scale: Animated.multiply(scaleAnims[tab.id], pulseAnims[tab.id]) },
                    { rotate },
                  ],
                },
              ]}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={iconColor}
              />
            </Animated.View>
            <Animated.View
              style={[
                styles.activeIndicator,
                {
                  width: indicatorWidth,
                  opacity: indicatorWidthAnims[tab.id],
                },
              ]}
            />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default BottomNavigation

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F4',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeTab: {
    // Active styling handled by iconContainer background
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#c96580',
    borderRadius: 2,
    alignSelf: 'center',
  },
})
