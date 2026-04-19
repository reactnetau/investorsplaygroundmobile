import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../providers/SubscriptionProvider';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { UpgradeModal } from '../components/UpgradeModal';
import { colors, fontSize, globalStyles, radius, shadow, spacing } from '../theme';
import { enqueueSnackbar } from '../lib/snackbar';

export function AccountScreen() {
  const { user, logout } = useAuth();
  const { profile, loading, fetchProfile } = useProfile();
  const { isSubscriptionActive, openManagementUrl } = useSubscription();
  const [showLogout, setShowLogout] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    try {
      await logout();
    } catch {
      // error via snackbar
    }
  };

  const handleManageSubscription = async () => {
    const opened = await openManagementUrl();
    if (!opened) {
      enqueueSnackbar('No subscription to manage', { variant: 'info' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[globalStyles.h1, { marginBottom: spacing.lg }]}>Account</Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.emailText}>{profile?.email ?? user?.username}</Text>
            <View style={[styles.planBadge, isSubscriptionActive && styles.planBadgePro]}>
              <Text style={[styles.planBadgeText, isSubscriptionActive && styles.planBadgeTextPro]}>
                {isSubscriptionActive ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription section */}
        <Text style={styles.sectionLabel}>Subscription</Text>
        {isSubscriptionActive ? (
          <View style={styles.card}>
            <View style={styles.proRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.proText}>Investors Playground Pro — Unlimited access</Text>
            </View>
            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
              <Text style={styles.manageButtonText}>Manage subscription</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeCard} onPress={() => setShowUpgrade(true)}>
            <View>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSubtitle}>Unlimited holdings & portfolios.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
          </TouchableOpacity>
        )}

        {/* Free tier limits */}
        {!isSubscriptionActive && (
          <View style={styles.limitsCard}>
            <Text style={styles.limitsTitle}>Free plan limits</Text>
            <View style={styles.limitRow}>
              <Ionicons name="trending-up-outline" size={16} color={colors.textMuted} />
              <Text style={styles.limitText}>5 holdings maximum</Text>
            </View>
            <View style={styles.limitRow}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textMuted} />
              <Text style={styles.limitText}>1 portfolio</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <Text style={styles.sectionLabel}>Actions</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowLogout(true)}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.actionTextDanger}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogout}
        title="Sign out?"
        message="You will need to sign in again to access your portfolios."
        confirmLabel="Sign out"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgraded={fetchProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  emailText: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planBadgePro: { backgroundColor: colors.primaryLight, borderColor: colors.borderStrong },
  planBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary },
  planBadgeTextPro: { color: colors.primaryDark },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  upgradeCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  upgradeTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.primaryDark },
  upgradeSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  proText: { fontSize: fontSize.base, fontWeight: '500', color: colors.text, flex: 1 },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  manageButtonText: { fontSize: fontSize.sm, color: colors.primaryDark, fontWeight: '600' },
  limitsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  limitsTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  limitText: { fontSize: fontSize.sm, color: colors.textSecondary },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  actionTextDanger: { fontSize: fontSize.base, fontWeight: '500', color: colors.error },
});
