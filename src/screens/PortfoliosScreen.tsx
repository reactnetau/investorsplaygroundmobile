import React, { useCallback, useState } from 'react';
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
import { PortfolioCard } from '../components/PortfolioCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { UpgradeModal } from '../components/UpgradeModal';
import { AppStackParamList, AppTabParamList } from '../navigation/types';
import { colors, globalStyles, radius, spacing } from '../theme';
import type { Portfolio } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Portfolios'>,
  StackNavigationProp<AppStackParamList>
>;

// Inner component to compute stats per portfolio
function PortfolioRow({ portfolio, onPress }: { portfolio: Portfolio; onPress: () => void }) {
  const { holdings } = useHoldings(portfolio.id);
  const withPnL = computeHoldingsWithPnL(holdings);
  const stats = computePortfolioStats(portfolio, withPnL);
  return <PortfolioCard portfolio={portfolio} stats={stats} onPress={onPress} />;
}

export function PortfoliosScreen() {
  const navigation = useNavigation<Nav>();
  const { isSubscriptionActive } = useSubscription();
  const { portfolios, loading, fetchPortfolios } = usePortfolios();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCreate = () => {
    if (!isSubscriptionActive && portfolios.length >= 1) {
      setShowUpgrade(true);
    } else {
      navigation.navigate('CreatePortfolio');
    }
  };

  useFocusEffect(
    useCallback(() => {
      void fetchPortfolios();
    }, [fetchPortfolios])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolios();
    setRefreshing(false);
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={globalStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={globalStyles.h1}>Portfolios</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
            <Ionicons name="add" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {portfolios.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No portfolios yet"
            description="Create your first paper trading portfolio."
          >
            <TouchableOpacity
              style={[globalStyles.primaryButton, { marginTop: spacing.md, paddingHorizontal: spacing.xl }]}
              onPress={handleCreate}
            >
              <Text style={globalStyles.primaryButtonText}>Create portfolio</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : (
          portfolios.map((p) => (
            <PortfolioRow key={p.id} portfolio={p} onPress={() => {}} />
          ))
        )}
      </ScrollView>

      <UpgradeModal
        visible={showUpgrade}
        reason="Free plan allows 1 portfolio. Upgrade to Pro for unlimited portfolios."
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
