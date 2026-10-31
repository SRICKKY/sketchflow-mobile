import { Image, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}
    >
      <Image
        resizeMode="contain"
        source={require('../../assets/android-icon-foreground.png')}
        style={{ width: size * 0.72, height: size * 0.72 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
});
