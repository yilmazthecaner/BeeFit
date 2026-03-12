/**
 * Login Screen — Clean Apple-style authentication
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { signInWithEmail, signUpWithEmail, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }

    let success: boolean;
    if (isSignUp) {
      success = await signUpWithEmail(email.trim(), password, displayName.trim());
    } else {
      success = await signInWithEmail(email.trim(), password);
    }

    if (success) {
      // Auth store will update isAuthenticated → root layout will redirect
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🐝</Text>
            <Text style={styles.logoText}>BeeFit</Text>
            <Text style={styles.tagline}>Your AI Health Coach</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={palette.textTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                placeholder="hello@example.com"
                placeholderTextColor={palette.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                placeholder="••••••••"
                placeholderTextColor={palette.textTertiary}
                secureTextEntry
              />
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setIsSignUp(!isSignUp); clearError(); }}
            activeOpacity={0.6}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Text style={styles.toggleHighlight}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type Palette = typeof Colors.light;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  logoText: { fontSize: 42, fontWeight: '800', color: Colors.primary, letterSpacing: -1 },
  tagline: { ...Typography.subhead, color: palette.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.md },
  inputContainer: { gap: 6 },
  inputLabel: { ...Typography.footnote, color: palette.textSecondary, fontWeight: '600', paddingLeft: 4 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.body,
    color: palette.text,
  },
  errorBox: { backgroundColor: Colors.systemRed + '12', borderRadius: BorderRadius.sm, padding: Spacing.sm },
  errorText: { ...Typography.footnote, color: Colors.systemRed, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...Typography.headline, color: '#FFF' },
  toggleBtn: { alignItems: 'center', marginTop: Spacing.xl },
  toggleText: { ...Typography.subhead, color: palette.textSecondary },
  toggleHighlight: { color: Colors.primary, fontWeight: '600' },
});
