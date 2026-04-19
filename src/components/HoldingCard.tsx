import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, radius, shadow, spacing } from '../theme';
import { gainLossColor } from '../theme';
import { formatCurrency, formatPct, formatPrice } from '../utils/currency';
import type { HoldingWithPnL } from '../types';

interface Props {
  holding: HoldingWithPnL;
  portfolioCurrency: string;
  onSell?: () => void;
}

export function HoldingCard({ holding, portfolioCurrency, onSell }: Props) {
  const pnlColor = gainLossColor(holding.gainLossPct);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{holding.code}</Text>
          <Text style={styles.currency}>{holding.priceCurrency}</Text>
        </View>
        <View style={styles.pnlBox}>
          <Text style={[styles.pnlPct, { color: pnlColor }]}>{formatPct(holding.gainLossPct)}</Text>
          <Text style={[styles.pnlAbs, { color: pnlColor }]}>{formatCurrency(holding.gainLoss, portfolioCurrency)}</Text>
        </View>
      </View>

      <View style={styles.midRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Qty</Text>
          <Text style={styles.statValue}>{holding.quantity}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Buy price</Text>
          <Text style={styles.statValue}>{formatPrice(holding.buyPrice, holding.priceCurrency)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>
            {holding.currentPrice ? formatPrice(holding.currentPrice, holding.priceCurrency) : '—'}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Days</Text>
          <Text style={styles.statValue}>{holding.daysHeld}d</Text>
        </View>
      </View>

      {onSell ? (
        <TouchableOpacity style={styles.sellButton} onPress={onSell}>
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>
      ) : null}
    </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  codeBox: {},
  code: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  currency: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  pnlBox: {
    alignItems: 'flex-end',
  },
  pnlPct: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  pnlAbs: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  midRow: {
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
    fontWeight: '500',
    color: colors.text,
  },
  sellButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  sellButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
