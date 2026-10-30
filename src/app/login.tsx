import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const { signIn, register } = useAuth();
  const { width } = useWindowDimensions();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTabletLayout = width >= 760;

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
          <View
            style={[
              styles.panel,
              isTabletLayout && styles.panelTablet,
              { maxWidth: isTabletLayout ? 1040 : 520 },
            ]}
          >
            <View style={[styles.brandPanel, isTabletLayout && styles.brandPanelTablet]}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>S</Text>
              </View>
              <View>
                <Text style={styles.brandName}>SketchFlow</Text>
                <Text style={styles.brandEyebrow}>THINK IT THROUGH</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandHeadline}>Make space for your best ideas.</Text>
                <Text style={styles.brandDescription}>
                  Plan, sketch, and shape ideas together on a canvas built for the
                  big screen.
                </Text>
              </View>
              <View style={styles.brandFooter}>
                <View style={styles.brandDot} />
                <Text style={styles.brandFooterText}>A little more room to think.</Text>
              </View>
            </View>

            <View style={styles.formPanel}>
              <Text style={styles.formEyebrow}>
                {isRegistering ? 'GET STARTED' : 'WELCOME BACK'}
              </Text>
              <Text style={styles.title}>
                {isRegistering ? 'Create your account' : 'Sign in to your canvas'}
              </Text>
              <Text style={styles.subtitle}>
                {isRegistering
                  ? 'Pick up your ideas wherever you work.'
                  : 'Your boards are ready when you are.'}
              </Text>

              {isRegistering ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    accessibilityLabel="Name"
                    autoCapitalize="words"
                    autoComplete="name"
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor="#98a2b3"
                    returnKeyType="next"
                    style={styles.input}
                    value={name}
                  />
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#98a2b3"
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
                  placeholder="At least 8 characters"
                  placeholderTextColor="#98a2b3"
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
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isRegistering ? 'Create account' : 'Sign in'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  {isRegistering ? 'Already have an account?' : 'New to SketchFlow?'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                >
                  <Text style={styles.switchAction}>
                    {isRegistering ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          <Text style={styles.legal}>By continuing, you agree to use SketchFlow responsibly.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6fb',
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
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    shadowColor: '#152346',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 36,
    elevation: 8,
  },
  panelTablet: {
    flexDirection: 'row',
  },
  brandPanel: {
    minHeight: 230,
    justifyContent: 'space-between',
    backgroundColor: '#202b4a',
    padding: 28,
  },
  brandPanelTablet: {
    width: '42%',
    minHeight: 580,
    padding: 36,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#c9f27a',
  },
  brandMarkText: {
    color: '#202b4a',
    fontSize: 24,
    fontWeight: '900',
  },
  brandName: {
    marginTop: 14,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  brandEyebrow: {
    marginTop: 4,
    color: '#aeb8d0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  brandCopy: {
    marginTop: 28,
  },
  brandHeadline: {
    maxWidth: 340,
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  brandDescription: {
    maxWidth: 340,
    marginTop: 14,
    color: '#c4cce0',
    fontSize: 15,
    lineHeight: 23,
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c9f27a',
  },
  brandFooterText: {
    marginLeft: 9,
    color: '#d9dfed',
    fontSize: 13,
  },
  formPanel: {
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  formEyebrow: {
    color: '#6975d5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    marginTop: 10,
    color: '#182230',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    marginTop: 22,
  },
  label: {
    marginBottom: 8,
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    color: '#182230',
    fontSize: 15,
  },
  errorBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#fecdca',
    borderRadius: 12,
    backgroundColor: '#fff6f5',
    padding: 13,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    borderRadius: 14,
    backgroundColor: '#5563dc',
  },
  submitButtonPressed: {
    backgroundColor: '#4452c2',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  switchText: {
    color: '#667085',
    fontSize: 14,
  },
  switchAction: {
    marginLeft: 6,
    color: '#4d5bd0',
    fontSize: 14,
    fontWeight: '700',
  },
  legal: {
    marginTop: 18,
    color: '#98a2b3',
    fontSize: 12,
    textAlign: 'center',
  },
});
