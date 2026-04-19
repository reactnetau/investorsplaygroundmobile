import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { colors, fontSize, globalStyles, spacing } from '../theme';

type Nav = StackNavigationProp<AuthStackParamList, 'ConfirmReset'>;
type Route = RouteProp<AuthStackParamList, 'ConfirmReset'>;

export function ConfirmResetScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { confirmForgotPassword } = useAuth();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const email = route.params.email;

  const canSubmit = code.length >= 6 && password.length >= 8 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await confirmForgotPassword(email, code.trim(), password);
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
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>Enter the code we sent to {email}.</Text>

        <View style={globalStyles.inputContainer}>
          <Text style={globalStyles.label}>Verification code</Text>
          <TextInput
            style={globalStyles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <View style={globalStyles.inputContainer}>
          <Text style={globalStyles.label}>New password</Text>
          <TextInput
            style={globalStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[globalStyles.primaryButton, !canSubmit && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={globalStyles.primaryButtonText}>Reset password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl },
});
