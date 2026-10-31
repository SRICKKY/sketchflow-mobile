import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

void SplashScreen.preventAutoHideAsync();

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
  const [startupDelayComplete, setStartupDelayComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStartupDelayComplete(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (status === 'loading' || !startupDelayComplete) {
    return (
      <AnimatedStartupScreen />
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

function AnimatedStartupScreen() {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.06],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '4deg'],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <View style={styles.startupScreen}>
      <Animated.Image
        accessibilityLabel="SketchFlow"
        resizeMode="contain"
        source={require('../../assets/brand-mark.png')}
        style={[
          styles.startupIcon,
          { opacity, transform: [{ scale }, { rotate }] },
        ]}
      />
      <Text style={styles.startupName}>SketchFlow</Text>
      <Text style={styles.startupMessage}>Preparing your workspace…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  startupScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  startupIcon: {
    width: 88,
    height: 88,
  },
  startupName: {
    marginTop: 16,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  startupMessage: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
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
