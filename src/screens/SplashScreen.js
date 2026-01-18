import { Animated, Image, StyleSheet, Text, StatusBar } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { screenHeight, screenWidth } from '../utils/Constants';
import { resetAndNavigate } from '../utils/NavigationUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

const Splashscreen = () => {
  // Rabbit image animations
  const rabbitFadeAnim = useRef(new Animated.Value(0)).current;
  const rabbitScaleAnim = useRef(new Animated.Value(0.4)).current;
  
  // Text animations - each word appears one by one
  const word1FadeAnim = useRef(new Animated.Value(0)).current; // "Comfort"
  const word1ScaleAnim = useRef(new Animated.Value(0.5)).current;
  const word2FadeAnim = useRef(new Animated.Value(0)).current; // "Comes"
  const word2ScaleAnim = useRef(new Animated.Value(0.5)).current;
  const word3FadeAnim = useRef(new Animated.Value(0)).current; // "First"
  const word3ScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Step 1: Rabbit appears first (fade in and scale up)
    Animated.parallel([
      Animated.timing(rabbitFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rabbitScaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: "Comfort" appears after rabbit (600ms delay to ensure rabbit completes)
    const word1Timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(word1FadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(word1ScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Step 3: "Comes" appears after "Comfort" (400ms after word1 starts)
    const word2Timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(word2FadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(word2ScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    // Step 4: "First" appears after "Comes" (400ms after word2 starts)
    const word3Timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(word3FadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(word3ScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1400);

    // Navigate after all animations complete (wait for all words to appear + 1 second)
    const timer = setTimeout(() => {
      // Exit animation - fade out everything
      Animated.parallel([
        Animated.timing(rabbitFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(word1FadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(word2FadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(word3FadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        resetAndNavigate('HomeScreen');
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(word1Timer);
      clearTimeout(word2Timer);
      clearTimeout(word3Timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rabbitAnimatedStyle = {
    opacity: rabbitFadeAnim,
    transform: [
      { scale: rabbitScaleAnim },
    ],
  };

  const word1AnimatedStyle = {
    opacity: word1FadeAnim,
    transform: [
      { scale: word1ScaleAnim },
    ],
  };

  const word2AnimatedStyle = {
    opacity: word2FadeAnim,
    transform: [
      { scale: word2ScaleAnim },
    ],
  };

  const word3AnimatedStyle = {
    opacity: word3FadeAnim,
    transform: [
      { scale: word3ScaleAnim },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff7f0"
        translucent={false}
      />
      <Animated.View style={[styles.imageContainer, rabbitAnimatedStyle]}>
        <Image 
          source={require('../assets/bunnie.jpg')} 
          style={styles.img}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.View style={styles.textRow}>
        <Animated.View style={word1AnimatedStyle}>
          <Text style={styles.textWord}>Comfort</Text>
        </Animated.View>
        <Animated.View style={word2AnimatedStyle}>
          <Text style={styles.textWord}> Comes </Text>
        </Animated.View>
        <Animated.View style={word3AnimatedStyle}>
          <Text style={styles.textWord}>First</Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

export default Splashscreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7f0',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  img: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.35,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    flexWrap: 'wrap',
  },
  textWord: {
    fontSize: 32,
    fontWeight: '700',
    color: '#c96580',
    letterSpacing: 1,
  },
})