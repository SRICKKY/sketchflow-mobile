import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isRegistering && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await register(name.trim(), normalizedEmail, password);
      } else {
        await signIn(normalizedEmail, password);
      }
      router.replace('/');
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Unable to reach the SketchFlow API. Check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.panel}>
            <View style={styles.brandHeader}>
              <BrandMark size={34} />
              <Text style={styles.brandName}>SketchFlow</Text>
            </View>
            <Text style={styles.title}>
              {isRegistering ? 'Create your account' : 'Welcome back to Sketchflow'}
            </Text>
            <Text style={styles.subtitle}>
              Pick up where your team left off on the infinite canvas.
            </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                disabled
                style={styles.googleButton}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  source={require('../../assets/google-mark.png')}
                  style={styles.googleMark}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                disabled
                style={[styles.googleButton, styles.githubButton]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  source={require('../../assets/github-mark.png')}
                  style={styles.googleMark}
                />
                <Text style={styles.googleButtonText}>Continue with GitHub</Text>
              </Pressable>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR CONTINUE WITH WORK EMAIL</Text>
                <View style={styles.divider} />
              </View>

              {isRegistering ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    accessibilityLabel="Name"
                    autoCapitalize="words"
                    autoComplete="name"
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={colors.muted}
                    returnKeyType="next"
                    style={styles.input}
                    value={name}
                  />
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Work email address</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="alex@company.com"
                  placeholderTextColor={colors.muted}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  accessibilityLabel="Password"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  onChangeText={setPassword}
                  onSubmitEditing={() => void submit()}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  returnKeyType="go"
                  secureTextEntry
                  style={styles.input}
                  textContentType={isRegistering ? 'newPassword' : 'password'}
                  value={password}
                />
              </View>

              {error ? (
                <View accessibilityRole="alert" style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !isSubmitting && styles.submitButtonPressed,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.primaryInk} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isRegistering ? 'Create account' : 'Sign In to Workspace'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isRegistering ? 'Already have an account?' : 'New here?'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                >
                  <Text style={styles.switchAction}>
                    {isRegistering ? 'Sign in' : 'Sign up for free'}
                  </Text>
                </Pressable>
              </View>
          </View>
          <Text style={styles.legal}>
            Password recovery is not available in the mobile app yet.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: colors.panel,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 5,
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandName: {
    marginLeft: 8,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 7,
    color: colors.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  googleButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.subtle,
  },
  googleMark: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  googleButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  githubButton: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.muted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  fieldGroup: {
    marginTop: 18,
  },
  label: {
    marginBottom: 7,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 13,
  },
  errorBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 12,
    backgroundColor: colors.errorBackground,
    padding: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryHover,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.primaryInk,
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  switchText: {
    color: colors.body,
    fontSize: 14,
  },
  switchAction: {
    marginLeft: 6,
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  legal: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
