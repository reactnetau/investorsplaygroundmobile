import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolios, useHoldings, computeHoldingsWithPnL, computePortfolioStats } from '../hooks/usePortfolio';
import { useSubscription } from '../providers/SubscriptionProvider';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { UpgradeModal } from '../components/UpgradeModal';
import { AppStackParamList, AppTabParamList } from '../navigation/types';
import { colors, fontSize, globalStyles, radius, spacing } from '../theme';
import { formatCurrency, formatPct } from '../utils/currency';
import { gainLossColor } from '../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Dashboard'>,
  StackNavigationProp<AppStackParamList>
>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { isSubscriptionActive } = useSubscription();
  const { portfolios, loading: portfoliosLoading, fetchPortfolios } = usePortfolios();
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activePortfolio = portfolios[activePortfolioIndex] ?? null;
  const { holdings, loading: holdingsLoading } = useHoldings(activePortfolio?.id ?? null);
  const holdingsWithPnL = computeHoldingsWithPnL(holdings);
  const stats = activePortfolio ? computePortfolioStats(activePortfolio, holdingsWithPnL) : null;

  const isLoading = portfoliosLoading || holdingsLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPortfolios();
    setRefreshing(false);
  }, [fetchPortfolios]);

  useFocusEffect(
    useCallback(() => {
      void fetchPortfolios();
    }, [fetchPortfolios])
  );

  if (isLoading && !refreshing) return <LoadingSpinner />;

  if (portfolios.length === 0) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <EmptyState
          icon="briefcase-outline"
          title="No portfolios yet"
          description="Create your first portfolio to start paper trading."
        >
          <TouchableOpacity
            style={[globalStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]}
            onPress={() => navigation.navigate('CreatePortfolio')}
          >
            <Text style={globalStyles.primaryButtonText}>Create portfolio</Text>
          </TouchableOpacity>
        </EmptyState>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={globalStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={globalStyles.kicker}>Dashboard</Text>
            <Text style={globalStyles.h1}>Investors Playground</Text>
          </View>
          {!isSubscriptionActive ? (
            <TouchableOpacity style={styles.proBadge} onPress={() => setShowUpgrade(true)}>
              <Text style={styles.proBadgeText}>Upgrade</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.proBadgeActive}>
              <Text style={styles.proBadgeActiveText}>Pro</Text>
            </View>
          )}
        </View>

        {/* Portfolio switcher */}
        {portfolios.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
            {portfolios.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.portfolioChip, i === activePortfolioIndex && styles.portfolioChipActive]}
                onPress={() => setActivePortfolioIndex(i)}
              >
                <Text style={[styles.portfolioChipText, i === activePortfolioIndex && styles.portfolioChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Portfolio name */}
        {activePortfolio && (
          <Text style={styles.portfolioName}>{activePortfolio.name}</Text>
        )}

        {/* Stats */}
        {stats && activePortfolio && (
          <View style={styles.statsGrid}>
            <StatCard
              label="Total value"
              value={formatCurrency(stats.totalValue, activePortfolio.currency)}
            />
            <StatCard
              label="Cash"
              value={formatCurrency(stats.cash, activePortfolio.currency)}
            />
            <StatCard
              label="Gain / Loss"
              value={formatCurrency(stats.gainLoss, activePortfolio.currency)}
              valueColor={gainLossColor(stats.gainLoss)}
              subtitle={formatPct(stats.gainLossPct)}
            />
            <StatCard
              label="Holdings"
              value={String(stats.holdingCount)}
              subtitle={!isSubscriptionActive ? `of 5 free` : 'unlimited'}
            />
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={globalStyles.sectionTitle}>Quick actions</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (!activePortfolio) return;
              if (!isSubscriptionActive && holdings.length >= 5) {
                setShowUpgrade(true);
              } else {
                navigation.navigate('Holdings', { portfolioId: activePortfolio.id });
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.actionText}>Buy stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Holdings', { portfolioId: activePortfolio?.id })}
          >
            <Ionicons name="list-outline" size={22} color={colors.primary} />
            <Text style={styles.actionText}>View holdings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Portfolios')}
          >
            <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
            <Text style={styles.actionText}>Portfolios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <UpgradeModal
        visible={showUpgrade}
        reason={!isSubscriptionActive && holdings.length >= 5 ? "You've reached the 5-holding limit on the free plan." : undefined}
        onClose={() => setShowUpgrade(false)}
        onUpgraded={fetchPortfolios}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  proBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  proBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryDark },
  proBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  proBadgeActiveText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryDark },
  portfolioScroll: { marginBottom: spacing.md },
  portfolioChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  portfolioChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  portfolioChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  portfolioChipTextActive: { color: colors.primaryDark, fontWeight: '600' },
  portfolioName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
