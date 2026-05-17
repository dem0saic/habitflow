import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Modal, TouchableOpacity, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Trophy, Calendar, BarChart2, Settings, KeyRound } from 'lucide-react-native';
import { useFonts } from 'expo-font';
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
import { rs, ms, ls } from './src/utils/responsive';
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

function TabIcon({ name, focused, color, themeC }) {
  const Icon = TAB_ICON_MAP[name];
  // Active tab gets a soft pill background behind the icon to give the bar shape.
  return (
    <View style={{
      width: rs(48), height: rs(28), borderRadius: rs(14),
      backgroundColor: focused ? themeC.primarySoft : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={rs(18)} color={color} strokeWidth={focused ? 2.5 : 1.75} />
    </View>
  );
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
          tabBarIcon: ({ focused, color }) => <TabIcon name={route.name} focused={focused} color={color} themeC={C} />,
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: ms(10),
              color: focused ? C.primary : C.textMuted,
              fontFamily: focused ? C.semi : C.med,
              fontWeight: focused ? '600' : '500',
              letterSpacing: 0.2,
              marginTop: rs(2),
            }}>
              {route.name}
            </Text>
          ),
          tabBarActiveTintColor:   C.primary,
          tabBarInactiveTintColor: C.textMuted,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopWidth: 1,
            borderTopColor: C.border,
            elevation: 0,
            shadowOpacity: 0,
            height: rs(64),
            paddingBottom: rs(10),
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
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
    // Custom brand-mark font, shipped in /assets. Non-commercial license
    // (FSLA) — a commercial license is required before App Store submission.
    'Chopera': require('./assets/Chopera.otf'),
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

// Decode the `email` claim from a JWT without verifying the signature.
// Signature verification happens on Supabase's side when setSession is called
// (and again on every authenticated request). The decode here is purely so
// the confirmation modal can show the email to the user before we accept it.
function emailFromJwt(jwt) {
  try {
    const payload = jwt.split('.')[1];
    if (!payload) return '';
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = (typeof atob === 'function' ? atob(padded) : globalThis.atob?.(padded)) || '';
    const parsed = JSON.parse(json);
    return parsed?.email || '';
  } catch {
    return '';
  }
}

function InnerApp() {
  const { state } = useStore();
  const C = useTheme();
  const [pendingRecovery, setPendingRecovery] = useState(null); // { accessToken, refreshToken, email }

  useEffect(() => { ensureAndroidChannel(); }, []);

  useEffect(() => {
    function handleUrl(url) {
      if (!url || !url.includes('type=recovery')) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = Object.fromEntries(new URLSearchParams(fragment));
      if (!params.access_token || !params.refresh_token) return;
      // Stage the tokens — do NOT call setSession yet. The user has to confirm
      // the email below before we accept a session from an untrusted deep link
      // (any installed app or crafted link can land here).
      setPendingRecovery({
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
        email: emailFromJwt(params.access_token),
      });
    }
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  async function confirmRecovery() {
    if (!pendingRecovery) return;
    await supabase.auth.setSession({
      access_token: pendingRecovery.accessToken,
      refresh_token: pendingRecovery.refreshToken,
    });
    setPendingRecovery(null);
  }

  function cancelRecovery() {
    setPendingRecovery(null);
  }

  return (
    <>
      <StatusBar style={state.themeMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
      <RecoveryConfirmModal
        visible={!!pendingRecovery}
        email={pendingRecovery?.email || ''}
        onConfirm={confirmRecovery}
        onCancel={cancelRecovery}
        C={C}
      />
    </>
  );
}

function RecoveryConfirmModal({ visible, email, onConfirm, onCancel, C }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: rs(24),
        }}
        onPress={onCancel}
      >
        <Pressable
          style={{
            backgroundColor: C.card, borderRadius: rs(18),
            borderWidth: 1, borderColor: C.borderStrong,
            padding: rs(22), width: '100%',
          }}
        >
          <View style={{
            width: rs(48), height: rs(48), borderRadius: rs(14),
            backgroundColor: C.primarySoft,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: rs(14),
          }}>
            <KeyRound size={rs(22)} color={C.primary} strokeWidth={2} />
          </View>
          <Text style={{
            fontSize: ms(18), fontFamily: C.bold, fontWeight: '700',
            color: C.text, marginBottom: rs(8), letterSpacing: ls(18),
          }}>
            Continue password reset?
          </Text>
          <Text style={{
            fontSize: ms(13), color: C.textSub, lineHeight: ms(20),
            fontFamily: C.reg, fontWeight: '400', marginBottom: rs(6),
            letterSpacing: ls(13),
          }}>
            A password reset link was opened for:
          </Text>
          <Text style={{
            fontSize: ms(14), color: C.text, fontFamily: C.semi, fontWeight: '600',
            marginBottom: rs(14), letterSpacing: ls(14),
          }} numberOfLines={1}>
            {email || 'an unknown account'}
          </Text>
          <Text style={{
            fontSize: ms(12), color: C.textMuted,
            fontFamily: C.reg, fontWeight: '400', marginBottom: rs(18),
            letterSpacing: ls(12), lineHeight: ms(18),
          }}>
            If this isn't your email, tap Cancel — the link may have come from
            somewhere you didn't expect.
          </Text>
          <View style={{ flexDirection: 'row', gap: rs(10) }}>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: rs(13), borderRadius: rs(10),
                borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center',
                backgroundColor: 'transparent',
              }}
              onPress={onCancel}
              activeOpacity={0.85}
            >
              <Text style={{
                fontSize: ms(14), fontFamily: C.semi, fontWeight: '600',
                color: C.textSub, letterSpacing: ls(14),
              }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: rs(13), borderRadius: rs(10),
                alignItems: 'center', backgroundColor: C.primary,
              }}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={{
                fontSize: ms(14), fontFamily: C.bold, fontWeight: '700',
                color: '#fff', letterSpacing: ls(14),
              }}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
