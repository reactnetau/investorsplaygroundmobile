import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { colors, fontSize, globalStyles, radius, spacing } from '../theme';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

type Nav = StackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { needsConfirmation } = await register(email.trim().toLowerCase(), password, currency);
      if (needsConfirmation) {
        navigation.navigate('ConfirmSignup', { email: email.trim().toLowerCase() });
      }
    } catch {
      // error shown via snackbar
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length >= 8 && !loading;

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start paper trading for free</Text>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Email</Text>
            <TextInput
              style={globalStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Password</Text>
            <TextInput
              style={globalStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.label}>Portfolio currency</Text>
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

          <TouchableOpacity
            style={[globalStyles.primaryButton, !canSubmit && styles.disabled]}
            onPress={handleSignup}
            disabled={!canSubmit}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={globalStyles.primaryButtonText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl },
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
  disabled: { opacity: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
});
