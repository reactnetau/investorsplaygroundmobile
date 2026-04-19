import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { generateClient } from 'aws-amplify/data';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList, AppTabParamList } from '../navigation/types';
import { usePortfolios, useHoldings, computeHoldingsWithPnL } from '../hooks/usePortfolio';
import { useSubscription } from '../providers/SubscriptionProvider';
import { HoldingCard } from '../components/HoldingCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { UpgradeModal } from '../components/UpgradeModal';
import { colors, fontSize, globalStyles, radius, spacing } from '../theme';
import { enqueueSnackbar } from '../lib/snackbar';
import type { HoldingWithPnL } from '../types';

type Nav = StackNavigationProp<AppStackParamList, 'Tabs'>;
type Route = RouteProp<AppTabParamList, 'Holdings'>;

const client = generateClient();

export function HoldingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { isSubscriptionActive } = useSubscription();
  const { portfolios, loading: portfoliosLoading, fetchPortfolios } = usePortfolios();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);

  const activePortfolio = portfolios[activeIndex] ?? null;
  const { holdings, loading: holdingsLoading, fetchHoldings } = useHoldings(activePortfolio?.id ?? null);
  const holdingsWithPnL = computeHoldingsWithPnL(holdings);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPortfolios(), fetchHoldings()]);
    setRefreshing(false);
  }, [fetchHoldings, fetchPortfolios]);

  useFocusEffect(
    useCallback(() => {
      void fetchPortfolios();
      void fetchHoldings();
    }, [fetchHoldings, fetchPortfolios])
  );

  const handleRefreshPrices = async () => {
    if (!activePortfolio) return;
    setRefreshingPrices(true);
    try {
      const result = await (client.mutations as any).refreshPrices({ portfolioId: activePortfolio.id });
      const data = result?.data;
      if (data?.error) {
        enqueueSnackbar('Price refresh failed', { variant: 'error', description: data.error });
      } else {
        enqueueSnackbar(`Updated ${data?.updatedCount ?? 0} prices`, { variant: 'success' });
        await Promise.all([fetchPortfolios(), fetchHoldings()]);
      }
    } catch {
      enqueueSnackbar('Price refresh failed', { variant: 'error' });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleResetPortfolio = async () => {
    if (!activePortfolio) return;
    try {
      const result = await (client.mutations as any).resetPortfolio({ portfolioId: activePortfolio.id });
      if (result?.data?.error) {
        enqueueSnackbar('Reset failed', { variant: 'error', description: result.data.error });
      } else {
        enqueueSnackbar('Portfolio reset', { variant: 'success' });
        await Promise.all([fetchPortfolios(), fetchHoldings()]);
      }
    } catch {
      enqueueSnackbar('Reset failed', { variant: 'error' });
    } finally {
      setResetTarget(null);
    }
  };

  if (portfoliosLoading) return <LoadingSpinner />;

  if (portfolios.length === 0) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <EmptyState icon="briefcase-outline" title="No portfolios" description="Create a portfolio first." />
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
          <Text style={globalStyles.h1}>Holdings</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleRefreshPrices}
              disabled={refreshingPrices}
            >
              {refreshingPrices ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setResetTarget(activePortfolio?.id ?? null)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Portfolio switcher */}
        {portfolios.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioScroll}>
            {portfolios.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.portfolioChip, i === activeIndex && styles.portfolioChipActive]}
                onPress={() => setActiveIndex(i)}
              >
                <Text style={[styles.portfolioChipText, i === activeIndex && styles.portfolioChipTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Buy button */}
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => {
            if (!activePortfolio) return;
            if (!isSubscriptionActive && holdings.length >= 5) {
              setShowUpgrade(true);
            } else {
              navigation.navigate('AddHolding', { portfolioId: activePortfolio.id });
            }
          }}
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.buyButtonText}>Buy stock</Text>
        </TouchableOpacity>

        {/* Holdings list */}
        {holdingsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : holdingsWithPnL.length === 0 ? (
          <EmptyState
            icon="trending-up-outline"
            title="No holdings"
            description="Buy your first stock to start tracking your portfolio."
          />
        ) : (
          holdingsWithPnL.map((h) => (
            <HoldingCard
              key={h.id}
              holding={h}
              portfolioCurrency={activePortfolio?.currency ?? 'AUD'}
              onSell={() =>
                navigation.navigate('SellHolding', {
                  holdingId: h.id,
                  code: h.code,
                  quantity: h.quantity,
                  buyPrice: h.buyPrice,
                  currentPrice: h.currentPrice,
                  priceCurrency: h.priceCurrency,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={resetTarget !== null}
        title="Reset portfolio?"
        message="This will delete all holdings and restore your starting cash. This cannot be undone."
        confirmLabel="Reset"
        destructive
        onConfirm={handleResetPortfolio}
        onCancel={() => setResetTarget(null)}
      />

      <UpgradeModal
        visible={showUpgrade}
        reason="You've reached the 5-holding limit on the free plan."
        onClose={() => setShowUpgrade(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  portfolioChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  portfolioChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  portfolioChipTextActive: { color: colors.primaryDark, fontWeight: '600' },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  buyButtonText: { color: colors.white, fontSize: fontSize.base, fontWeight: '600' },
});
