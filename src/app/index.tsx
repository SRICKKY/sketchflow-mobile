import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>SketchFlow</Text>
        <Text style={styles.subtitle}>Signed in as {user.email}</Text>
        <Pressable onPress={() => void handleSignOut()} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#182230',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    color: '#667085',
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#5563dc',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
