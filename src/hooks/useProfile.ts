import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { UserProfile } from '../types';

const client = generateClient();

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await (client.models as any).UserProfile.list();
      const items: UserProfile[] = result.data ?? [];
      setProfile(items[0] ?? null);
    } catch (err) {
      console.error('[useProfile] fetch failed', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    try {
      await (client.models as any).UserProfile.update({ id, ...updates });
      await fetchProfile();
    } catch (err) {
      console.error('[useProfile] update failed', err);
      throw err;
    }
  }, [fetchProfile]);

  return { profile, loading, error, fetchProfile, updateProfile };
}
