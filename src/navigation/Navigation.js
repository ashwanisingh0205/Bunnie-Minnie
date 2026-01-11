import 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { navigationRef } from '../utils/NavigationUtils';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import WebViewScreen from '../screens/WebViewScreen';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}>
        <Stack.Screen 
          name="SplashScreen" 
          component={SplashScreen}
        />
        <Stack.Screen 
          name="HomeScreen" 
          component={HomeScreen}
        />
        <Stack.Screen 
          name="LoginScreen" 
          component={WebViewScreen}
        />
        <Stack.Screen 
          name="ContactScreen" 
          component={WebViewScreen}
        />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;