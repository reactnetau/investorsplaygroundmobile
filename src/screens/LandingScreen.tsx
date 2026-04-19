import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../navigation/types';
import { colors, fontSize, radius, shadow, spacing } from '../theme';

type Nav = StackNavigationProp<AuthStackParamList, 'Landing'>;

const FEATURES = [
  { icon: 'trending-up-outline' as const, title: 'Paper Trade Stocks', desc: 'Buy and sell ASX, NASDAQ, NSE, and BSE stocks risk-free.' },
  { icon: 'briefcase-outline' as const, title: 'Manage Portfolios', desc: 'Track multiple portfolios with realistic cash balances.' },
  { icon: 'analytics-outline' as const, title: 'Track Performance', desc: 'See real-time P&L, gain/loss %, and days held.' },
];

export function LandingScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Paper Trading Simulator</Text>
          </View>
          <Text style={styles.headline}>
            Investors{'\n'}
            <Text style={styles.headlineAccent}>Playground</Text>
          </Text>
          <Text style={styles.subline}>
            Practice investing without risking real money. Trade stocks on global markets with a virtual portfolio.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctas}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Start for free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>Free plan: 5 holdings, 1 portfolio. Pro: unlimited. One-off payment.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  hero: { marginBottom: spacing.xl },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  headlineAccent: {
    color: colors.primary,
  },
  subline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  features: { gap: spacing.sm, marginBottom: spacing.xl },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 18 },
  ctas: { gap: spacing.sm, marginBottom: spacing.md },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  primaryButtonText: { color: colors.white, fontSize: fontSize.base, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: fontSize.base, fontWeight: '500' },
  footnote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
