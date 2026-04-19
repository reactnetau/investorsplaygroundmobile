import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { colors, fontSize, globalStyles, spacing } from '../theme';

type Nav = StackNavigationProp<AuthStackParamList, 'ConfirmSignup'>;
type Route = RouteProp<AuthStackParamList, 'ConfirmSignup'>;

export function ConfirmSignupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { confirmEmail } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route.params.email;

  const handleConfirm = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await confirmEmail(email, code.trim());
      navigation.navigate('Login');
    } catch {
      // error via snackbar
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={globalStyles.inputContainer}>
          <Text style={globalStyles.label}>Verification code</Text>
          <TextInput
            style={globalStyles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[globalStyles.primaryButton, (!code || loading) && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!code || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Verify email</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
  email: { fontWeight: '600', color: colors.text },
});
