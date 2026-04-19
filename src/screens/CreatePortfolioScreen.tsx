import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../types/amplify-schema';
import type { AppStackParamList } from '../navigation/types';
import { ensureCurrentUserProfile } from '../services/profile';
import { colors, fontSize, globalStyles, radius, spacing } from '../theme';
import { enqueueSnackbar } from '../lib/snackbar';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

const client = generateClient<Schema>();
type Nav = StackNavigationProp<AppStackParamList, 'CreatePortfolio'>;

export function CreatePortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [startingCash, setStartingCash] = useState('10000');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length > 0 && parseFloat(startingCash) > 0 && !loading;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const args = {
        name: name.trim(),
        currency,
        startingCash: parseFloat(startingCash),
      };

      let result = await client.mutations.createPortfolioWithLimits(args);
      if (result.data?.errorCode === 'NO_PROFILE') {
        await ensureCurrentUserProfile(currency);
        result = await client.mutations.createPortfolioWithLimits(args);
      }

      const data = result?.data;
      if (data?.error) {
        if (data.errorCode === 'PORTFOLIO_LIMIT') {
          enqueueSnackbar('Portfolio limit reached', { variant: 'error', description: data.error });
        } else {
          enqueueSnackbar('Failed to create portfolio', { variant: 'error', description: data.error });
        }
      } else {
        enqueueSnackbar(`Created "${name.trim()}"`, { variant: 'success' });
        navigation.navigate('Tabs', { screen: 'Portfolios' });
      }
    } catch (err) {
      console.error('[CreatePortfolio]', err);
      enqueueSnackbar('Failed to create portfolio', {
        variant: 'error',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Portfolio name</Text>
            <TextInput
              style={globalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="My Portfolio"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Currency</Text>
            <View style={styles.currencyRow}>
              {SUPPORTED_CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                  onPress={() => setCurrency(c.code)}
                >
                  <Text style={[styles.currencyChipText, currency === c.code && styles.currencyChipTextActive]}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Starting cash</Text>
            <TextInput
              style={globalStyles.input}
              value={startingCash}
              onChangeText={setStartingCash}
              placeholder="10000"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[globalStyles.primaryButton, !canSubmit && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={globalStyles.primaryButtonText}>Create portfolio</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currencyChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  currencyChipText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  currencyChipTextActive: { color: colors.primaryDark, fontWeight: '600' },
});
