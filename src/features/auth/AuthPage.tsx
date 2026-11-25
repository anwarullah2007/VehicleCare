import { useState } from 'react';
import {
  requestPasswordRecovery,
  signIn,
  signUp,
  updatePassword,
} from '@/services/authService';

export type AuthMode = 'signin' | 'signup' | 'recovery' | 'update_password';

interface AuthPageProps {
  initialMode?: AuthMode;
  onPasswordUpdated?: () => void;
}

export function AuthPage({
  initialMode = 'signin',
  onPasswordUpdated,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn({ email, password });
        if (res.error) {
          setErrorMessage(res.error.message);
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          return;
        }
        const res = await signUp({ email, password, fullName });
        if (res.error) {
          setErrorMessage(res.error.message);
        } else if (res.data.needsEmailConfirmation) {
          setSuccessMessage(
            'Account created. Please check your email to confirm your address before signing in.',
          );
        } else {
          setSuccessMessage('Account created and signed in.');
        }
      } else if (mode === 'recovery') {
        const res = await requestPasswordRecovery(email);
        if (res.error) {
          setErrorMessage(res.error.message);
        } else {
          setSuccessMessage(
            'If an account exists for that email, a password recovery link has been sent.',
          );
        }
      } else if (mode === 'update_password') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          return;
        }
        const res = await updatePassword(password);
        if (res.error) {
          setErrorMessage(res.error.message);
        } else {
          setSuccessMessage('Password updated successfully.');
          onPasswordUpdated?.();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            VC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              VehicleCare
            </h1>
            <p className="text-xs text-slate-500">
              Vehicle Parts Lifecycle &amp; Maintenance Tracker
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-semibold text-slate-900">
          {mode === 'signin' && 'Sign in to your account'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'recovery' && 'Reset your password'}
          {mode === 'update_password' && 'Set a new password'}
        </h2>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'signup' ? (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : null}

          {mode !== 'update_password' ? (
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-slate-700"
              >
                Email Address *
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : null}

          {mode !== 'recovery' ? (
            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700"
              >
                {mode === 'update_password' ? 'New Password *' : 'Password *'}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : null}

          {mode === 'signup' || mode === 'update_password' ? (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm Password *
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'recovery'
                    ? 'Send Recovery Email'
                    : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          {mode === 'signin' ? (
            <>
              <button
                type="button"
                onClick={() => switchMode('recovery')}
                className="font-medium text-blue-600 hover:underline"
              >
                Forgot your password?
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-medium text-slate-700 hover:underline"
              >
                Need an account? Sign up
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="font-medium text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
