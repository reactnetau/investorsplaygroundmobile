import { useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  AuthError,
} from 'aws-amplify/auth';
import { ensureCurrentUserProfile, ensureUserProfile } from '../services/profile';
import { enqueueSnackbar } from '../lib/snackbar';

export interface AuthUser {
  userId: string;
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser({ userId: current.userId, username: current.username });
      try {
        await ensureCurrentUserProfile('AUD');
      } catch (err) {
        console.warn('[useAuth] profile bootstrap failed', err);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const result = await signIn({ username: email, password });
        if (result.isSignedIn) {
          try {
            await ensureUserProfile(email, 'AUD');
          } catch (err) {
            console.warn('[useAuth] profile init failed', err);
          }
          await refresh();
          enqueueSnackbar('Signed in', { variant: 'success' });
        } else {
          switch (result.nextStep.signInStep) {
            case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
              enqueueSnackbar('New password required', { variant: 'info' });
              break;
            default:
              enqueueSnackbar('Additional step required', { variant: 'info', description: result.nextStep.signInStep });
          }
        }
      } catch (err) {
        enqueueSnackbar('Sign in failed', { variant: 'error', description: parseAuthError(err) });
        throw err;
      }
    },
    [refresh]
  );

  const register = useCallback(
    async (email: string, password: string, currency = 'AUD'): Promise<{ needsConfirmation: boolean }> => {
      try {
        const result = await signUp({
          username: email,
          password,
          options: {
            userAttributes: { email },
            clientMetadata: { currency },
          },
        });
        const needsConfirmation = result.nextStep.signUpStep === 'CONFIRM_SIGN_UP';
        if (needsConfirmation) {
          enqueueSnackbar('Verification code sent', {
            variant: 'success',
            description: 'Check your email to verify your account.',
          });
        }
        return { needsConfirmation };
      } catch (err) {
        enqueueSnackbar('Sign up failed', { variant: 'error', description: parseAuthError(err) });
        throw err;
      }
    },
    []
  );

  const confirmEmail = useCallback(async (email: string, code: string): Promise<void> => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      enqueueSnackbar('Email verified', {
        variant: 'success',
        description: 'You can now sign in.',
      });
    } catch (err) {
      enqueueSnackbar('Verification failed', { variant: 'error', description: parseAuthError(err) });
      throw err;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      enqueueSnackbar('Sign out failed', { variant: 'error', description: parseAuthError(err) });
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await resetPassword({ username: email });
      enqueueSnackbar('Reset code sent', {
        variant: 'success',
        description: `We sent a verification code to ${email}.`,
      });
    } catch (err) {
      enqueueSnackbar('Failed to send reset code', { variant: 'error', description: parseAuthError(err) });
      throw err;
    }
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<void> => {
      try {
        await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
        enqueueSnackbar('Password reset', {
          variant: 'success',
          description: 'Your password has been updated.',
        });
      } catch (err) {
        enqueueSnackbar('Password reset failed', { variant: 'error', description: parseAuthError(err) });
        throw err;
      }
    },
    []
  );

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  return { user, loading, refresh, login, register, confirmEmail, logout, forgotPassword, confirmForgotPassword, getIdToken };
}

export function parseAuthError(err: unknown): string {
  const name = typeof err === 'object' && err !== null && 'name' in err ? String((err as any).name) : '';
  const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as any).message) : '';
  const suggestion = typeof err === 'object' && err !== null && 'recoverySuggestion' in err ? String((err as any).recoverySuggestion) : '';

  if (err instanceof AuthError || name) {
    switch (name) {
      case 'UserAlreadyAuthenticatedException': return 'You are already signed in.';
      case 'UserNotConfirmedException': return 'Please verify your email before signing in.';
      case 'NotAuthorizedException': return 'Incorrect email or password.';
      case 'UserNotFoundException': return 'No account found with that email.';
      case 'UsernameExistsException': return 'An account with this email already exists.';
      case 'CodeMismatchException': return 'Invalid verification code. Please try again.';
      case 'ExpiredCodeException': return 'Code has expired. Please request a new one.';
      case 'LimitExceededException': return 'Too many attempts. Please wait.';
      case 'InvalidPasswordException': return 'Password must be at least 8 characters.';
      default: return suggestion || message || 'An unexpected error occurred.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
