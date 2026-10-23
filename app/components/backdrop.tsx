import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/** Soft terracotta and sage glows behind auth and onboarding screens. */
export function Backdrop() {
  const { width, height } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const t = THEME[colorScheme ?? 'light'];
  const strength = colorScheme === 'dark' ? 0.22 : 0.28;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="warm" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={t.primary} stopOpacity={strength} />
            <Stop offset="1" stopColor={t.primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="cool" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={t.sage} stopOpacity={strength} />
            <Stop offset="1" stopColor={t.sage} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.95} cy={height * 0.06} r={width * 0.75} fill="url(#warm)" />
        <Circle cx={width * 0.02} cy={height * 0.62} r={width * 0.7} fill="url(#cool)" />
      </Svg>
    </View>
  );
}
