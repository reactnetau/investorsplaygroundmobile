import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient();

/**
 * Ensures a UserProfile exists for the given email and currency.
 * Idempotent — safe to call multiple times.
 */
export async function ensureUserProfile(email: string, currency: string): Promise<void> {
  try {
    await (client.mutations as any).initializeUserProfile({ email, currency });
  } catch (err) {
    console.warn('[profile] ensureUserProfile failed', err);
  }
}

/**
 * Fetches the current Cognito user's email and calls ensureUserProfile.
 */
export async function ensureCurrentUserProfile(currency = 'AUD'): Promise<void> {
  try {
    const attributes = await fetchUserAttributes();
    const email = attributes.email;
    if (email) {
      await ensureUserProfile(email, currency);
    }
  } catch (err) {
    // User might not be authenticated yet
    console.warn('[profile] ensureCurrentUserProfile failed', err);
  }
}
