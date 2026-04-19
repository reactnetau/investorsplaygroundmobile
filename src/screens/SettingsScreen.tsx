import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { colors, fontSize, globalStyles, radius, shadow, spacing } from '../theme';

export function SettingsScreen() {
  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        <Text style={[globalStyles.h1, { marginBottom: spacing.lg }]}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.label}>App version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Markets supported</Text>
          <Text style={styles.value}>ASX · NASDAQ · NYSE · NSE · BSE</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Price data</Text>
          <Text style={styles.value}>Yahoo Finance (refreshed on demand)</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Investors Playground is a paper trading simulator for educational purposes only. No real money is involved. Past performance of simulated portfolios does not reflect real-world returns.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },
  noteCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
});
