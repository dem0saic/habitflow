import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Trophy, Calendar, BarChart2, Settings } from 'lucide-react-native';
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
import { rs } from './src/utils/responsive';
import { ensureAndroidChannel } from './src/utils/notifications';
import TodayScreen from './src/screens/TodayScreen';
import ChallengeScreen from './src/screens/ChallengeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();

const TAB_ICON_MAP = {
  Today:     Home,
  Challenge: Trophy,
  History:   Calendar,
  Stats:     BarChart2,
  Settings:  Settings,
};

function TabIcon({ name, focused, color }) {
  const Icon = TAB_ICON_MAP[name];
  return <Icon size={rs(22)} color={color} strokeWidth={focused ? 2.5 : 1.75} />;
}

function AppNavigator() {
  const { state, storeReady } = useStore();
  const { session, loading, recoveryMode } = useAuth();
  const C = useTheme();

  if (loading || !storeReady) return null;
  if (!session || recoveryMode) return <AuthScreen />;
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
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      </Tab.Navigator>
    </NavigationContainer>
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
          <ThemeProvider>
            <InnerApp />
          </ThemeProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function InnerApp() {
  const { state } = useStore();

  useEffect(() => { ensureAndroidChannel(); }, []);

  useEffect(() => {
    function handleUrl(url) {
      if (!url || !url.includes('type=recovery')) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = Object.fromEntries(new URLSearchParams(fragment));
      if (params.access_token && params.refresh_token) {
        supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    }
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={state.themeMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}
