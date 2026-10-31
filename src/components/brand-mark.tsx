import { Image } from 'react-native';

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no"
      resizeMode="contain"
      source={require('../../assets/brand-mark.png')}
      style={{ width: size, height: size }}
    />
  );
}
