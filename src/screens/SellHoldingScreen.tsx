import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { generateClient } from 'aws-amplify/data';
import { AppStackParamList } from '../navigation/types';
import { colors, fontSize, globalStyles, radius, spacing } from '../theme';
import { gainLossColor } from '../theme';
import { enqueueSnackbar } from '../lib/snackbar';
import { formatCurrency, formatPct, formatPrice } from '../utils/currency';

type Nav = StackNavigationProp<AppStackParamList, 'SellHolding'>;
type Route = RouteProp<AppStackParamList, 'SellHolding'>;

const client = generateClient();

export function SellHoldingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { holdingId, code, quantity: maxQty, buyPrice, currentPrice, priceCurrency } = route.params;

  const sellPrice = currentPrice ?? buyPrice;
  const [quantity, setQuantity] = useState(String(maxQty));
  const [submitting, setSubmitting] = useState(false);

  const sellQty = parseFloat(quantity);
  const isValid = !isNaN(sellQty) && sellQty > 0 && sellQty <= maxQty;
  const proceeds = isValid ? sellQty * sellPrice : 0;
  const gainLoss = isValid ? (sellPrice - buyPrice) * sellQty : 0;
  const gainLossPct = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

  const handleSell = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const result = await (client.mutations as any).sellHolding({
        holdingId,
        quantity: sellQty,
      });
      const data = result?.data;
      if (data?.error) {
        enqueueSnackbar('Sell failed', { variant: 'error', description: data.error });
      } else {
        enqueueSnackbar(`Sold ${sellQty} × ${code}`, {
          variant: 'success',
          description: `${formatPct(gainLossPct)} P&L`,
        });
        navigation.goBack();
      }
    } catch {
      enqueueSnackbar('Sell failed', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Holding summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.codeText}>{code}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Buy price</Text>
                <Text style={styles.summaryValue}>{formatPrice(buyPrice, priceCurrency)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current price</Text>
                <Text style={styles.summaryValue}>
                  {currentPrice ? formatPrice(currentPrice, priceCurrency) : '—'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>P&L</Text>
                <Text style={[styles.summaryValue, { color: gainLossColor(gainLossPct) }]}>
                  {formatPct(gainLossPct)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quantity input */}
          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Quantity to sell (max {maxQty})</Text>
            <TextInput
              style={globalStyles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity onPress={() => setQuantity(String(maxQty))} style={styles.maxLink}>
              <Text style={styles.maxLinkText}>Sell all</Text>
            </TouchableOpacity>
          </View>

          {/* Proceeds */}
          {isValid && (
            <View style={styles.proceedsCard}>
              <View style={styles.proceedsRow}>
                <Text style={styles.proceedsLabel}>Proceeds</Text>
                <Text style={styles.proceedsValue}>{formatCurrency(proceeds, priceCurrency)}</Text>
              </View>
              <View style={styles.proceedsRow}>
                <Text style={styles.proceedsLabel}>Gain / Loss</Text>
                <Text style={[styles.proceedsValue, { color: gainLossColor(gainLoss) }]}>
                  {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss, priceCurrency)} ({formatPct(gainLossPct)})
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sellButton, (!isValid || submitting) && { opacity: 0.5 }]}
            onPress={handleSell}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.sellButtonText}>Confirm Sell</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  codeText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  maxLink: { alignSelf: 'flex-end', marginTop: spacing.xs },
  maxLinkText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500' },
  proceedsCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  proceedsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proceedsLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  proceedsValue: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
  sellButton: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  sellButtonText: { color: colors.white, fontSize: fontSize.base, fontWeight: '600' },
});
