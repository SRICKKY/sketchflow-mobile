import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { status, error, retrySession } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateText}>Connecting to SketchFlow…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.stateScreen}>
        <Text style={styles.errorTitle}>Can’t connect right now</Text>
        <Text style={styles.stateText}>
          {error ?? 'Check your connection and API URL, then try again.'}
        </Text>
        <Pressable onPress={() => void retrySession()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected
        guard={status === 'unauthenticated'}
        redirectTo="/"
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected
        guard={status === 'authenticated'}
        redirectTo="/login"
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="boards/[id]" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  stateText: {
    marginTop: 16,
    color: colors.body,
    fontSize: 16,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: {
    color: colors.primaryInk,
    fontSize: 15,
    fontWeight: '700',
  },
});
