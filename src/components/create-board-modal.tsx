import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api/client';

export function CreateBoardModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    const boardName = name.trim();
    if (!boardName || boardName.length > 80) {
      setError('Board names must contain 1 to 80 characters.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onCreate(boardName);
      setName('');
    } catch (createError) {
      setError(
        createError instanceof ApiError
          ? createError.message
          : 'Unable to create the board. Check your connection and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const close = () => {
    if (isSaving) {
      return;
    }
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      transparent
      visible={visible}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable accessibilityLabel="Close dialog" onPress={close} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.headingRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>+</Text>
            </View>
            <Pressable accessibilityLabel="Close dialog" onPress={close} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Start with a blank canvas</Text>
          <Text style={styles.subtitle}>
            Give your board a name. You can rename it any time.
          </Text>

          <Text style={styles.label}>Board name</Text>
          <TextInput
            accessibilityLabel="Board name"
            autoFocus
            maxLength={80}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            onSubmitEditing={() => void submit()}
            placeholder="Untitled board"
            placeholderTextColor="#98a2b3"
            returnKeyType="done"
            style={styles.input}
            value={name}
          />

          {error ? (
            <View accessibilityRole="alert" style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable disabled={isSaving} onPress={close} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void submit()}
              style={[styles.createButton, isSaving && styles.disabled]}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createText}>Create board</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 28, 48, 0.48)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 28,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#eef0ff',
  },
  icon: {
    color: '#5563dc',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f2f4f7',
  },
  closeText: {
    color: '#667085',
    fontSize: 23,
    lineHeight: 26,
  },
  title: {
    marginTop: 23,
    color: '#202b4a',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    marginTop: 24,
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
    paddingHorizontal: 15,
    color: '#182230',
    fontSize: 15,
  },
  errorBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#fecdca',
    borderRadius: 10,
    backgroundColor: '#fff6f5',
    padding: 12,
  },
  errorText: {
    color: '#b42318',
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 26,
  },
  cancelButton: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  cancelText: {
    color: '#475467',
    fontSize: 14,
    fontWeight: '700',
  },
  createButton: {
    minWidth: 132,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#5563dc',
    paddingHorizontal: 17,
  },
  disabled: {
    opacity: 0.7,
  },
  createText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
