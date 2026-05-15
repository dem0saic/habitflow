import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyledProvider } from '@gluestack-style/react';
import { useFonts } from 'expo-font';
import { RussoOne_400Regular } from '@expo-google-fonts/russo-one';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
  WorkSans_800ExtraBold,
} from '@expo-google-fonts/work-sans';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { AuthProvider, useAuth } from './src/AuthContext';
import { gluestackUIConfig } from './src/gluestack.config';
import { rs } from './src/utils/responsive';
import { ensureAndroidChannel } from './src/utils/notifications';
import TodayScreen from './src/screens/TodayScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Today:     { focused: 'home',      outline: 'home-outline' },
  Challenge: { focused: 'trophy',    outline: 'trophy-outline' },
  History:   { focused: 'calendar',  outline: 'calendar-outline' },
  Stats:     { focused: 'bar-chart', outline: 'bar-chart-outline' },
};

function TabIcon({ name, focused, color }) {
  const icon = TAB_ICONS[name];
  return (
    <Ionicons
      name={focused ? icon.focused : icon.outline}
      size={rs(22)}
      color={color}
    />
  );
}

function AppNavigator() {
  const { state, storeReady } = useStore();
  const { session, loading } = useAuth();
  const C = useTheme();

  if (loading || !storeReady) return null;
  if (!session) return <AuthScreen />;
  if (!state.onboardingDone) return <OnboardingScreen />;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} />,
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: rs(10),
              color: focused ? C.primary : C.textMuted,
              fontFamily: focused ? C.bold : C.reg,
              fontWeight: focused ? '700' : '400',
              letterSpacing: -0.5,
            }}>
              {route.name}
            </Text>
          ),
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.textMuted,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopWidth: 1,
            borderTopColor: C.border,
            elevation: 30,
            shadowColor: C.primary,
            shadowOpacity: state.themeMode !== 'light' ? 0.3 : 0.1,
            shadowRadius: rs(20),
            shadowOffset: { width: 0, height: -rs(4) },
            height: rs(70),
            paddingBottom: rs(12),
            paddingTop: rs(8),
          },
        })}
      >
        <Tab.Screen name="Today"     component={TodayScreen} />
        <Tab.Screen name="Challenge" component={ChallengeScreen} />
        <Tab.Screen name="History"   component={HistoryScreen} />
        <Tab.Screen name="Stats"     component={StatsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/**
 * Bridges the persisted store `themeMode` into GluestackUIProvider's
 * colorMode prop so gluestack's useColorMode() always reflects the
 * user's saved preference.
 */
function GluestackWrapper({ children }) {
  const { state } = useStore();
  return (
    <StyledProvider config={gluestackUIConfig} colorMode={state.themeMode}>
      {children}
    </StyledProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    RussoOne_400Regular,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StoreProvider>
          <GluestackWrapper>
            <ThemeProvider>
              <InnerApp />
            </ThemeProvider>
          </GluestackWrapper>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function InnerApp() {
  const { state } = useStore();

  // Create Android notification channel on every app start (idempotent, no-op on iOS)
  useEffect(() => { ensureAndroidChannel(); }, []);

  return (
    <>
      {/* Read themeMode directly from store — useColorMode() from gluestack never re-renders */}
      <StatusBar style={state.themeMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}
