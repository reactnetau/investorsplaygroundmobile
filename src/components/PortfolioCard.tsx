import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, shadow, spacing } from '../theme';
import { gainLossColor } from '../theme';
import { formatCurrency, formatPct } from '../utils/currency';
import type { Portfolio, PortfolioStats } from '../types';

interface Props {
  portfolio: Portfolio;
  stats?: PortfolioStats;
  isActive?: boolean;
  onPress?: () => void;
}

export function PortfolioCard({ portfolio, stats, isActive, onPress }: Props) {
  const pnlColor = stats ? gainLossColor(stats.gainLossPct) : colors.textMuted;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, isActive && styles.activeCard]}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {isActive ? (
              <View style={styles.activeDot} />
            ) : null}
            <Text style={styles.name}>{portfolio.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Cash</Text>
            <Text style={styles.statValue}>{formatCurrency(portfolio.cash, portfolio.currency)}</Text>
          </View>
          {stats ? (
            <>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Value</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalValue, portfolio.currency)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Return</Text>
                <Text style={[styles.statValue, { color: pnlColor }]}>{formatPct(stats.gainLossPct)}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Currency</Text>
            <Text style={styles.statValue}>{portfolio.currency}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  activeCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
});
