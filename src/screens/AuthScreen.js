import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle, CheckCircle, Mail, Lock, Eye, EyeOff, ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { rs, ms, ls } from '../utils/responsive';
import AppLogo from '../components/AppLogo';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, updatePassword, recoveryMode } = useAuth();
  const C = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode]           = useState('signIn');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');

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
        setInfo('Password updated — you are now signed in.');
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
    setError(''); setInfo(''); setPassword(''); setConfirm('');
  }

  function goForgotPassword() {
    setMode('forgotPassword');
    setError(''); setInfo(''); setPassword(''); setConfirm('');
  }

  function goBackToSignIn() {
    setMode('signIn');
    setError(''); setInfo('');
  }

  const tagline = recoveryMode
    ? 'Set a new password'
    : mode === 'forgotPassword'
    ? 'Forgot your password'
    : mode === 'signIn'
    ? 'Welcome back'
    : 'Create your account';

  const submitLabel = recoveryMode
    ? 'Update password'
    : mode === 'forgotPassword'
    ? 'Send reset link'
    : mode === 'signIn'
    ? 'Sign in'
    : 'Create account';

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Soft warm radial in the bottom corner */}
        <View style={{
          position: 'absolute',
          bottom: -rs(80), right: -rs(80),
          width: rs(300), height: rs(300), borderRadius: rs(150),
          backgroundColor: C.primary, opacity: 0.07,
        }} />
        <View style={{
          position: 'absolute',
          top: -rs(60), left: -rs(60),
          width: rs(220), height: rs(220), borderRadius: rs(110),
          backgroundColor: C.primary, opacity: 0.04,
        }} />

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
            {/* Branding — vertical lockup: ripple mark above wordmark */}
            <View style={styles.brandStack}>
              <AppLogo size={rs(64)} />
              <Text style={styles.logoText}>HabitFlow</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>

              {recoveryMode ? (
                <>
                  <Text style={styles.recoveryHint}>
                    Choose a new password for your account.
                  </Text>

                  {!!error && <Banner type="error" Icon={AlertCircle} text={error} styles={styles} C={C} />}
                  {!!info  && <Banner type="info"  Icon={CheckCircle} text={info}  styles={styles} C={C} />}

                  <Text style={styles.label}>New password</Text>
                  <View style={styles.inputRow}>
                    <Lock size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                      {showPass
                        ? <EyeOff size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                        : <Eye    size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                      }
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Confirm password</Text>
                  <View style={styles.inputRow}>
                    <Lock size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                      {showConfirm
                        ? <EyeOff size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                        : <Eye    size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                      }
                    </Pressable>
                  </View>

                  <SubmitButton label={submitLabel} loading={loading} onPress={handleSubmit} styles={styles} C={C} />
                </>

              ) : mode === 'forgotPassword' ? (
                <>
                  <TouchableOpacity onPress={goBackToSignIn} style={styles.backRow} hitSlop={rs(8)}>
                    <ArrowLeft size={rs(15)} color={C.primary} strokeWidth={2} />
                    <Text style={styles.backText}>Back to sign in</Text>
                  </TouchableOpacity>

                  {!!error && <Banner type="error" Icon={AlertCircle} text={error} styles={styles} C={C} />}
                  {!!info  && <Banner type="info"  Icon={CheckCircle} text={info}  styles={styles} C={C} />}

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Mail size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                <>
                  <View style={styles.tabs}>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'signIn' && styles.tabActive]}
                      onPress={() => mode !== 'signIn' && switchMode()}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>Sign in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'signUp' && styles.tabActive]}
                      onPress={() => mode !== 'signUp' && switchMode()}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>Sign up</Text>
                    </TouchableOpacity>
                  </View>

                  {!!error && <Banner type="error" Icon={AlertCircle} text={error} styles={styles} C={C} />}
                  {!!info  && <Banner type="info"  Icon={CheckCircle} text={info}  styles={styles} C={C} />}

                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Mail size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                    <Lock size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                      {showPass
                        ? <EyeOff size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                        : <Eye    size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                      }
                    </Pressable>
                  </View>

                  {mode === 'signIn' && (
                    <TouchableOpacity onPress={goForgotPassword} style={styles.forgotRow} hitSlop={rs(8)}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}

                  {mode === 'signUp' && (
                    <>
                      <Text style={styles.label}>Confirm password</Text>
                      <View style={styles.inputRow}>
                        <Lock size={rs(16)} color={C.textMuted} strokeWidth={1.75} style={styles.inputIcon} />
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
                          {showConfirm
                            ? <EyeOff size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                            : <Eye    size={rs(17)} color={C.textMuted} strokeWidth={1.75} />
                          }
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
                        {mode === 'signIn' ? 'Sign up' : 'Sign in'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

function Banner({ type, Icon, text, styles, C }) {
  return (
    <View style={type === 'error' ? styles.errorBanner : styles.infoBanner}>
      <Icon size={rs(14)} color={type === 'error' ? C.danger : C.success} strokeWidth={2} />
      <Text style={type === 'error' ? styles.errorText : styles.infoText}>{text}</Text>
    </View>
  );
}

function SubmitButton({ label, loading, onPress, styles, C }) {
  return (
    <TouchableOpacity
      style={[styles.btn, loading && styles.btnDisabled]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.btnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

function makeStyles(C) {
  return {
    scroll:    { alignItems: 'center', paddingHorizontal: rs(24) },
    brandStack: { alignItems: 'center', marginBottom: rs(28) },
    logoText: {
      color: C.text, fontSize: ms(36),
      fontFamily: C.logo,        // Chopera (display face)
      letterSpacing: 0.5,         // Chopera is decorative — a touch of breathing room reads cleaner
      marginTop: rs(14),
    },
    tagline: {
      color: C.textMuted, fontSize: ms(11),
      fontFamily: C.med, fontWeight: '500',
      letterSpacing: 1.6, textTransform: 'uppercase',
      marginTop: rs(8),
    },
    card: {
      width: '100%',
      backgroundColor: C.card,
      borderRadius: rs(18),
      borderWidth: 1, borderColor: C.border,
      padding: rs(22),
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: C.cardHigh,
      borderRadius: rs(10),
      padding: rs(4),
      marginBottom: rs(20),
      borderWidth: 1, borderColor: C.border,
    },
    tab:       { flex: 1, paddingVertical: rs(9), borderRadius: rs(8), alignItems: 'center' },
    tabActive: { backgroundColor: C.primary },
    tabText:   { fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', color: C.textMuted, letterSpacing: ls(13) },
    tabTextActive: { color: '#fff' },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: rs(8),
      backgroundColor: C.dangerSoft,
      borderRadius: rs(10), padding: rs(11),
      marginBottom: rs(14),
      borderWidth: 1, borderColor: C.danger,
    },
    errorText: { color: C.danger, fontSize: ms(12), fontFamily: C.med, fontWeight: '500', flex: 1, letterSpacing: ls(12) },
    infoBanner: {
      flexDirection: 'row', alignItems: 'center', gap: rs(8),
      backgroundColor: C.successSoft,
      borderRadius: rs(10), padding: rs(11),
      marginBottom: rs(14),
      borderWidth: 1, borderColor: C.success,
    },
    infoText: { color: C.success, fontSize: ms(12), fontFamily: C.med, fontWeight: '500', flex: 1, letterSpacing: ls(12) },

    label: {
      color: C.textMuted, fontSize: ms(11),
      fontFamily: C.bold, fontWeight: '700',
      letterSpacing: 0.8, textTransform: 'uppercase',
      marginBottom: rs(7), marginTop: rs(4),
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.cardHigh,
      borderRadius: rs(12),
      borderWidth: 1, borderColor: C.border,
      marginBottom: rs(14),
      paddingHorizontal: rs(12),
    },
    inputIcon: { marginRight: rs(8) },
    input: {
      flex: 1, color: C.text, fontSize: ms(14),
      fontFamily: C.reg, fontWeight: '400',
      paddingVertical: rs(13), letterSpacing: ls(14),
    },
    eyeBtn: { paddingLeft: rs(8), paddingVertical: rs(4) },

    forgotRow:  { alignSelf: 'flex-end', marginTop: rs(-6), marginBottom: rs(18) },
    forgotText: { color: C.primary, fontSize: ms(12), fontFamily: C.semi, fontWeight: '600', letterSpacing: ls(12) },
    backRow:    { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(20) },
    backText:   { color: C.primary, fontSize: ms(13), fontFamily: C.semi, fontWeight: '600', letterSpacing: ls(13) },

    recoveryHint: {
      color: C.textSub, fontSize: ms(13),
      fontFamily: C.reg, fontWeight: '400',
      letterSpacing: ls(13), marginBottom: rs(20),
    },

    btn: {
      backgroundColor: C.primary,
      borderRadius: rs(12),
      paddingVertical: rs(15),
      alignItems: 'center',
      marginTop: rs(6), marginBottom: rs(8),
    },
    btnDisabled: { opacity: 0.6 },
    btnText:     { color: '#fff', fontSize: ms(15), fontFamily: C.bold, fontWeight: '700', letterSpacing: ls(15) },

    switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: rs(4) },
    switchText: { color: C.textMuted, fontSize: ms(13), fontFamily: C.reg, fontWeight: '400' },
    switchLink: { color: C.primary, fontSize: ms(13), fontFamily: C.bold, fontWeight: '700' },
  };
}
