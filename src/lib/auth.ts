import { supabase } from './supabase';
import { AUTH_CALLBACK_URL } from './config';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_CALLBACK_URL },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function getUser(session: Session | null): User | null {
  return session?.user ?? null;
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}
