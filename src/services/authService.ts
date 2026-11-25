import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseError, type ServiceResult } from '@/services/errorUtils';
import type { Profile } from '@/types/domain';

export interface SignUpInput {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export async function getCurrentSession(
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Session | null>> {
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: data.session, error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
  client: SupabaseClient = getSupabaseClient(),
): () => void {
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

export async function signUp(
  input: SignUpInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<{ needsEmailConfirmation: boolean }>> {
  const email = input.email.trim();
  const fullName = input.fullName?.trim();

  if (!email || !input.password) {
    return {
      data: null,
      error: { kind: 'VALIDATION', message: 'Email and password are required.' },
    };
  }

  if (input.password.length < 6) {
    return {
      data: null,
      error: {
        kind: 'VALIDATION',
        message: 'Password must be at least 6 characters long.',
      },
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: input.password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
      },
    });

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return {
      data: { needsEmailConfirmation: !data.session },
      error: null,
    };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function signIn(
  input: SignInInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Session>> {
  const email = input.email.trim();
  if (!email || !input.password) {
    return {
      data: null,
      error: { kind: 'VALIDATION', message: 'Email and password are required.' },
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.session) {
      return {
        data: null,
        error: normalizeSupabaseError(
          error ?? { message: 'Invalid email or password.' },
        ),
      };
    }

    return { data: data.session, error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function signOut(
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<void>> {
  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function requestPasswordRecovery(
  email: string,
  redirectTo: string = window.location.origin,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<void>> {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      data: null,
      error: { kind: 'VALIDATION', message: 'Please enter your email address.' },
    };
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(trimmed, {
      redirectTo,
    });
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function updatePassword(
  newPassword: string,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<void>> {
  if (newPassword.length < 6) {
    return {
      data: null,
      error: {
        kind: 'VALIDATION',
        message: 'New password must be at least 6 characters long.',
      },
    };
  }

  try {
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function fetchUserProfile(
  session: Session,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Profile>> {
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, timezone')
      .eq('id', session.user.id)
      .single();

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return {
      data: {
        id: data.id,
        fullName:
          data.full_name ??
          (session.user.user_metadata?.full_name as string | undefined) ??
          session.user.email ??
          'Vehicle Owner',
        email: session.user.email ?? '',
        timezone: data.timezone ?? 'Asia/Kolkata',
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}
