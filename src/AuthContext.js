import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') setRecoveryMode(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'habitflow://localhost/reset-password',
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setRecoveryMode(false);
  }

  // Invokes the delete-account Edge Function. The function cascades all of the
  // user's rows server-side using the service role key, then deletes the auth.users
  // row. On success we sign out locally to clear the session.
  async function deleteAccount() {
    const { data, error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, resetPassword, updatePassword, deleteAccount, recoveryMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
