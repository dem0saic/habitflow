import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, updatePassword, recoveryMode } = useAuth();
  const C = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('signIn');   // 'signIn' | 'signUp' | 'forgotPassword'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const styles = makeStyles(C);

  function validate() {
    if (recoveryMode) {
      if (!password) return 'New password is required.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
      if (password !== confirm) return 'Passwords do not match.';
      return null;
    }
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (mode === 'forgotPassword') return null;
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'signUp' && password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit() {
    setError('');
    setInfo('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (recoveryMode) {
        await updatePassword(password);
        setInfo('Password updated! You are now signed in.');
        setPassword('');
        setConfirm('');
      } else if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else if (mode === 'signUp') {
        await signUp(email.trim(), password);
        setInfo('Check your email to confirm your account, then sign in.');
        setMode('signIn');
        setPassword('');
        setConfirm('');
      } else if (mode === 'forgotPassword') {
        await resetPassword(email.trim());
        setInfo('Reset link sent — check your inbox.');
        setMode('signIn');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === 'signIn' ? 'signUp' : 'signIn');
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
  }

  function goForgotPassword() {
    setMode('forgotPassword');
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
  }

  function goBackToSignIn() {
    setMode('signIn');
    setError('');
    setInfo('');
  }

  const tagline = recoveryMode
    ? 'Set a new password'
    : mode === 'forgotPassword'
    ? 'Forgot your password?'
    : mode === 'signIn'
    ? 'Welcome back'
    : 'Create your account';

  const submitLabel = recoveryMode
    ? 'Update Password'
    : mode === 'forgotPassword'
    ? 'Send Reset Link'
    : mode === 'signIn'
    ? 'Sign In'
    : 'Create Account';

  return (
    <>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#061519', '#0A2830', '#C8502A']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + rs(48), paddingBottom: insets.bottom + rs(32) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Branding */}
            <View style={styles.brandRow}>
              <View style={styles.iconTile}>
                <Ionicons name="checkmark-done" size={rs(28)} color="#fff" />
              </View>
              <Text style={styles.logoText}>HabitFlow</Text>
            </View>
            <Text style={styles.tagline}>{tagline}</Text>

            {/* Card */}
            <View style={styles.card}>

              {recoveryMode ? (
                /* ── Reset Password (arrived via deep link) ── */
                <>
                  <Text style={styles.recoveryHint}>
                    Choose a new password for your account.
                  </Text>

                  {!!error && <Banner type="error" icon="alert-circle" text={error} styles={styles} />}
                  {!!info  && <Banner type="info"  icon="checkmark-circle" text={info} styles={styles} />}

                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={t => { setPassword(t); setError(''); }}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                    <Pressable onPress={() => setShowPass(v => !v)} style={styles.eyeBtn} hitSlop={rs(8)}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color={C.textMuted} />
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={confirm}
                      onChangeText={t => { setConfirm(t); setError(''); }}
                      placeholder="Repeat new password"
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                    <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={rs(8)}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color={C.textMuted} />
                    </Pressable>
                  </View>

                  <SubmitButton label={submitLabel} loading={loading} onPress={handleSubmit} styles={styles} C={C} />
                </>

              ) : mode === 'forgotPassword' ? (
                /* ── Forgot Password ── */
                <>
                  <TouchableOpacity onPress={goBackToSignIn} style={styles.backRow} hitSlop={rs(8)}>
                    <Ionicons name="arrow-back" size={rs(16)} color={C.primary} />
                    <Text style={styles.backText}>Back to Sign In</Text>
                  </TouchableOpacity>

                  {!!error && <Banner type="error" icon="alert-circle" text={error} styles={styles} />}
                  {!!info  && <Banner type="info"  icon="checkmark-circle" text={info} styles={styles} />}

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={t => { setEmail(t); setError(''); }}
                      placeholder="you@example.com"
                      placeholderTextColor={C.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  <SubmitButton label={submitLabel} loading={loading} onPress={handleSubmit} styles={styles} C={C} />
                </>

              ) : (
                /* ── Sign In / Sign Up ── */
                <>
                  <View style={styles.tabs}>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'signIn' && styles.tabActive]}
                      onPress={() => mode !== 'signIn' && switchMode()}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'signUp' && styles.tabActive]}
                      onPress={() => mode !== 'signUp' && switchMode()}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>

                  {!!error && <Banner type="error" icon="alert-circle" text={error} styles={styles} />}
                  {!!info  && <Banner type="info"  icon="checkmark-circle" text={info} styles={styles} />}

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={t => { setEmail(t); setError(''); }}
                      placeholder="you@example.com"
                      placeholderTextColor={C.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={t => { setPassword(t); setError(''); }}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType={mode === 'signUp' ? 'next' : 'done'}
                      onSubmitEditing={mode === 'signIn' ? handleSubmit : undefined}
                    />
                    <Pressable onPress={() => setShowPass(v => !v)} style={styles.eyeBtn} hitSlop={rs(8)}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color={C.textMuted} />
                    </Pressable>
                  </View>

                  {mode === 'signIn' && (
                    <TouchableOpacity onPress={goForgotPassword} style={styles.forgotRow} hitSlop={rs(8)}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}

                  {mode === 'signUp' && (
                    <>
                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="lock-closed-outline" size={rs(17)} color={C.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={confirm}
                          onChangeText={t => { setConfirm(t); setError(''); }}
                          placeholder="Repeat password"
                          placeholderTextColor={C.textMuted}
                          secureTextEntry={!showConfirm}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit}
                        />
                        <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={rs(8)}>
                          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color={C.textMuted} />
                        </Pressable>
                      </View>
                    </>
                  )}

                  <SubmitButton label={submitLabel} loading={loading} onPress={handleSubmit} styles={styles} C={C} />

                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>
                      {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
                    </Text>
                    <TouchableOpacity onPress={switchMode} hitSlop={rs(8)}>
                      <Text style={styles.switchLink}>
                        {mode === 'signIn' ? 'Sign Up' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

function Banner({ type, icon, text, styles }) {
  return (
    <View style={type === 'error' ? styles.errorBanner : styles.infoBanner}>
      <Ionicons name={icon} size={rs(15)} color={type === 'error' ? '#ff6b6b' : '#6bffb8'} />
      <Text style={type === 'error' ? styles.errorText : styles.infoText}>{text}</Text>
    </View>
  );
}

function SubmitButton({ label, loading, onPress, styles, C }) {
  return (
    <TouchableOpacity
      style={[styles.btn, loading && styles.btnDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color={C.primary} size="small" />
        : <Text style={styles.btnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

function makeStyles(C) {
  return {
    scroll: {
      alignItems: 'center',
      paddingHorizontal: rs(24),
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: rs(10),
      marginBottom: rs(6),
    },
    iconTile: {
      width: rs(46),
      height: rs(46),
      borderRadius: rs(14),
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: '#fff',
      fontSize: ms(28),
      fontFamily: C.logo,
      letterSpacing: 2,
    },
    tagline: {
      color: 'rgba(255,255,255,0.50)',
      fontSize: ms(12),
      fontFamily: C.med,
      fontWeight: '500',
      letterSpacing: ls(12),
      textTransform: 'uppercase',
      marginBottom: rs(28),
    },
    card: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: rs(20),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
      padding: rs(24),
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.30)',
      borderRadius: rs(12),
      padding: rs(4),
      marginBottom: rs(20),
    },
    tab: {
      flex: 1,
      paddingVertical: rs(9),
      borderRadius: rs(9),
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: C.primary,
    },
    tabText: {
      fontSize: ms(13),
      fontFamily: C.bold,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: ls(13),
    },
    tabTextActive: {
      color: '#fff',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: rs(7),
      backgroundColor: 'rgba(255,107,107,0.12)',
      borderRadius: rs(10),
      padding: rs(12),
      marginBottom: rs(14),
      borderWidth: 1,
      borderColor: 'rgba(255,107,107,0.25)',
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: ms(12),
      fontFamily: C.reg,
      fontWeight: '400',
      flex: 1,
      letterSpacing: ls(12),
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: rs(7),
      backgroundColor: 'rgba(107,255,184,0.10)',
      borderRadius: rs(10),
      padding: rs(12),
      marginBottom: rs(14),
      borderWidth: 1,
      borderColor: 'rgba(107,255,184,0.22)',
    },
    infoText: {
      color: '#6bffb8',
      fontSize: ms(12),
      fontFamily: C.reg,
      fontWeight: '400',
      flex: 1,
      letterSpacing: ls(12),
    },
    label: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: ms(11),
      fontFamily: C.semi,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: rs(7),
      marginTop: rs(4),
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderRadius: rs(12),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      marginBottom: rs(14),
      paddingHorizontal: rs(12),
    },
    inputIcon: {
      marginRight: rs(8),
    },
    input: {
      flex: 1,
      color: '#fff',
      fontSize: ms(14),
      fontFamily: C.reg,
      fontWeight: '400',
      paddingVertical: rs(13),
      letterSpacing: ls(14),
    },
    eyeBtn: {
      paddingLeft: rs(8),
      paddingVertical: rs(4),
    },
    forgotRow: {
      alignSelf: 'flex-end',
      marginTop: rs(-6),
      marginBottom: rs(18),
    },
    forgotText: {
      color: C.primary,
      fontSize: ms(12),
      fontFamily: C.semi,
      fontWeight: '600',
      letterSpacing: ls(12),
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: rs(6),
      marginBottom: rs(20),
    },
    backText: {
      color: C.primary,
      fontSize: ms(13),
      fontFamily: C.semi,
      fontWeight: '600',
      letterSpacing: ls(13),
    },
    recoveryHint: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: ms(13),
      fontFamily: C.reg,
      fontWeight: '400',
      letterSpacing: ls(13),
      marginBottom: rs(20),
    },
    btn: {
      backgroundColor: C.primary,
      borderRadius: rs(14),
      paddingVertical: rs(16),
      alignItems: 'center',
      marginTop: rs(6),
      marginBottom: rs(8),
      shadowColor: C.primary,
      shadowOpacity: 0.45,
      shadowRadius: rs(12),
      shadowOffset: { width: 0, height: rs(4) },
      elevation: 5,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: '#fff',
      fontSize: ms(15),
      fontFamily: C.bold,
      fontWeight: '700',
      letterSpacing: ls(15),
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: rs(4),
    },
    switchText: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: ms(13),
      fontFamily: C.reg,
      fontWeight: '400',
    },
    switchLink: {
      color: C.primary,
      fontSize: ms(13),
      fontFamily: C.bold,
      fontWeight: '700',
    },
  };
}
