import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../providers/SubscriptionProvider';
import { colors, fontSize, radius, shadow, spacing } from '../theme';
import { enqueueSnackbar } from '../lib/snackbar';

interface Props {
  visible: boolean;
  reason?: string;
  onClose: () => void;
  onUpgraded?: () => void;
}

const PRO_FEATURES = [
  'Unlimited stock holdings',
  'Unlimited portfolios',
  'All markets: ASX, NASDAQ, NSE, BSE',
];

export function UpgradeModal({ visible, reason, onClose, onUpgraded }: Props) {
  const { purchaseCurrentPackage, restorePurchases, purchaseLoading, restoreLoading, currentPackage } = useSubscription();

  const handleUpgrade = async () => {
    try {
      const customerInfo = await purchaseCurrentPackage();
      if (customerInfo) {
        enqueueSnackbar('Welcome to Pro!', { variant: 'success' });
        onUpgraded?.();
        onClose();
      }
    } catch (err: any) {
      if (err?.userCancelled) return;
      enqueueSnackbar('Purchase failed', { variant: 'error', description: err?.message ?? undefined });
    }
  };

  const handleRestore = async () => {
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        const isActive = Object.values(customerInfo.entitlements.active).some((e) => e.isActive);
        if (isActive) {
          enqueueSnackbar('Purchases restored!', { variant: 'success' });
          onUpgraded?.();
          onClose();
        } else {
          enqueueSnackbar('No active purchases found', { variant: 'info' });
        }
      }
    } catch (err: any) {
      enqueueSnackbar('Restore failed', { variant: 'error', description: err?.message ?? undefined });
    }
  };

  const priceLabel = currentPackage?.product?.priceString
    ? `Upgrade to Pro — ${currentPackage.product.priceString}`
    : 'Upgrade to Pro';

  const isLoading = purchaseLoading || restoreLoading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PRO</Text>
          </View>

          <Text style={styles.title}>Unlock Investors Playground Pro</Text>

          {reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          <View style={styles.features}>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
            onPress={handleUpgrade}
            disabled={isLoading}
          >
            {purchaseLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.ctaText}>{priceLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restoreButton, isLoading && styles.ctaButtonDisabled]}
            onPress={handleRestore}
            disabled={isLoading}
          >
            {restoreLoading ? (
              <ActivityIndicator color={colors.primaryDark} size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore purchases</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    ...shadow.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  reasonBox: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    marginBottom: spacing.md,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors.warning,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  restoreButton: {
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restoreText: {
    color: colors.primaryDark,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  dismissButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  dismissText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
