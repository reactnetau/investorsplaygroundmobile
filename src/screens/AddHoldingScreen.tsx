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
import { enqueueSnackbar } from '../lib/snackbar';
import { formatPrice } from '../utils/currency';

type Nav = StackNavigationProp<AppStackParamList, 'AddHolding'>;
type Route = RouteProp<AppStackParamList, 'AddHolding'>;

const client = generateClient();

type Market = 'ASX' | 'NASDAQ' | 'NSE' | 'BSE';

const MARKET_OPTIONS: { value: Market; label: string; placeholder: string }[] = [
  { value: 'ASX', label: 'ASX (Australia)', placeholder: 'BHP, CBA, WES' },
  { value: 'NASDAQ', label: 'NASDAQ / NYSE (US)', placeholder: 'AAPL, MSFT, TSLA' },
  { value: 'NSE', label: 'NSE (India)', placeholder: 'RELIANCE, TCS' },
  { value: 'BSE', label: 'BSE (India)', placeholder: 'RELIANCE, TCS' },
];

function normalizeCodeForMarket(rawCode: string, market: Market): string {
  const stockCode = rawCode.trim().toUpperCase();
  if (stockCode.includes('.')) return stockCode;
  if (market === 'ASX') return `${stockCode}.AX`;
  if (market === 'NSE') return `${stockCode}.NS`;
  if (market === 'BSE') return `${stockCode}.BO`;
  return stockCode;
}

export function AddHoldingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { portfolioId } = route.params;

  const [market, setMarket] = useState<Market>('ASX');
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amountToSpend, setAmountToSpend] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [lookupPrice, setLookupPrice] = useState<number | null>(null);
  const [lookupCurrency, setLookupCurrency] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedMarket = MARKET_OPTIONS.find((option) => option.value === market)!;
  const parsedQuantity = parseFloat(quantity);
  const parsedAmountToSpend = parseFloat(amountToSpend);
  const parsedManualPrice = parseFloat(manualPrice);
  const hasQuantity = !isNaN(parsedQuantity) && parsedQuantity > 0;
  const hasAmountToSpend = !isNaN(parsedAmountToSpend) && parsedAmountToSpend > 0;
  const hasPrice = !isNaN(parsedManualPrice) && parsedManualPrice > 0;
  const calculatedQuantity = hasAmountToSpend && hasPrice ? parsedAmountToSpend / parsedManualPrice : null;
  const submitQuantity = hasAmountToSpend ? calculatedQuantity : parsedQuantity;
  const totalCost = hasAmountToSpend
    ? parsedAmountToSpend
    : hasQuantity && hasPrice
    ? parsedQuantity * parsedManualPrice
    : null;

  const handleLookup = async () => {
    const trimmedCode = normalizeCodeForMarket(code, market);
    if (!trimmedCode) return;
    setLookingUp(true);
    setLookupPrice(null);
    try {
      const result = await (client.queries as any).fetchPrice({ code: trimmedCode });
      const data = result?.data;
      if (data?.error || !data?.price) {
        enqueueSnackbar('Price not found', { variant: 'error', description: data?.error ?? 'Check the stock code.' });
      } else {
        setLookupPrice(data.price);
        setLookupCurrency(data.currency);
        setManualPrice(String(data.price));
        enqueueSnackbar(`${trimmedCode}: ${formatPrice(data.price, data.currency)}`, { variant: 'success' });
      }
    } catch {
      enqueueSnackbar('Lookup failed', { variant: 'error' });
    } finally {
      setLookingUp(false);
    }
  };

  const handleBuy = async () => {
    const trimmedCode = normalizeCodeForMarket(code, market);
    const qty = submitQuantity ?? NaN;
    const price = parsedManualPrice;

    if (!trimmedCode || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      enqueueSnackbar('Please enter a stock, price, and either quantity or amount.', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await (client.mutations as any).buyHolding({
        portfolioId,
        code: trimmedCode,
        buyPrice: price,
        quantity: qty,
        purchasedOn: new Date().toISOString(),
      });
      const data = result?.data;
      if (data?.error) {
        if (data.errorCode === 'HOLDING_LIMIT') {
          enqueueSnackbar('Holding limit reached', { variant: 'error', description: data.error });
        } else if (data.errorCode === 'INSUFFICIENT_CASH') {
          enqueueSnackbar('Insufficient cash', { variant: 'error', description: data.error });
        } else {
          enqueueSnackbar('Purchase failed', { variant: 'error', description: data.error });
        }
      } else {
        enqueueSnackbar(`Bought ${qty} × ${trimmedCode}`, { variant: 'success' });
        navigation.goBack();
      }
    } catch {
      enqueueSnackbar('Purchase failed', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = code.trim().length > 0 && hasPrice && (hasQuantity || hasAmountToSpend) && !submitting;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>Enter a stock ticker code (e.g. AAPL, BHP.AX, RELIANCE.NS)</Text>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Market</Text>
            <View style={styles.marketGrid}>
              {MARKET_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.marketChip, market === option.value && styles.marketChipActive]}
                  onPress={() => {
                    setMarket(option.value);
                    setCode('');
                    setQuantity('');
                    setAmountToSpend('');
                    setManualPrice('');
                    setLookupPrice(null);
                    setLookupCurrency(null);
                  }}
                >
                  <Text style={[styles.marketChipText, market === option.value && styles.marketChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Code + lookup */}
          <View style={styles.codeRow}>
            <View style={[globalStyles.inputContainer, { flex: 1, marginBottom: 0 }]}>
              <Text style={globalStyles.label}>Stock code</Text>
              <TextInput
                style={globalStyles.input}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                placeholder={selectedMarket.placeholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.lookupButton, lookingUp && { opacity: 0.6 }]}
              onPress={handleLookup}
              disabled={!code.trim() || lookingUp}
            >
              {lookingUp ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.lookupButtonText}>Look up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={[globalStyles.inputContainer, { marginTop: spacing.md }]}>
            <Text style={globalStyles.label}>
              Buy price {lookupCurrency ? `(${lookupCurrency})` : ''}
            </Text>
            <TextInput
              style={globalStyles.input}
              value={manualPrice}
              onChangeText={setManualPrice}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            {lookupPrice !== null && (
              <Text style={styles.lookupNote}>
                Live price: {formatPrice(lookupPrice, lookupCurrency ?? 'USD')}
              </Text>
            )}
          </View>

          {/* Quantity */}
          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Quantity (shares)</Text>
            <TextInput
              style={[globalStyles.input, hasAmountToSpend && styles.disabledInput]}
              value={quantity}
              onChangeText={(value) => {
                setQuantity(value);
                if (value.trim()) setAmountToSpend('');
              }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              editable={!hasAmountToSpend}
            />
          </View>

          {/* Amount */}
          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>
              Amount to spend {lookupCurrency ? `(${lookupCurrency})` : ''}
            </Text>
            <TextInput
              style={[globalStyles.input, hasQuantity && styles.disabledInput]}
              value={amountToSpend}
              onChangeText={(value) => {
                setAmountToSpend(value);
                if (value.trim()) setQuantity('');
              }}
              placeholder="500"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              editable={!hasQuantity}
            />
            {calculatedQuantity !== null && (
              <Text style={styles.lookupNote}>
                Estimated shares: {calculatedQuantity.toFixed(4)}
              </Text>
            )}
          </View>

          {/* Total cost */}
          {totalCost !== null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total cost</Text>
              <Text style={styles.totalValue}>
                {formatPrice(totalCost, lookupCurrency ?? 'AUD')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[globalStyles.primaryButton, !canSubmit && { opacity: 0.5 }]}
            onPress={handleBuy}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={globalStyles.primaryButtonText}>Buy</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  marketChip: {
    width: '48%',
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  marketChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  marketChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  marketChipTextActive: {
    color: colors.primaryDark,
  },
  codeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  lookupButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  lookupButtonText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  lookupNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  disabledInput: {
    opacity: 0.45,
    backgroundColor: colors.surfaceSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  totalLabel: { fontSize: fontSize.sm, color: colors.primaryDark, fontWeight: '500' },
  totalValue: { fontSize: fontSize.lg, fontWeight: '600', color: colors.primaryDark },
});
