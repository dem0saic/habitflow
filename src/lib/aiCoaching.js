import { supabase } from './supabase';

export async function fetchCoachingNudge() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('ai-coaching-nudge', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  return data?.content ?? null;
}

export async function fetchReflectionSummary(period = 'weekly') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('ai-reflection-summary', {
    body: { period },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  return data?.content ?? null;
}
