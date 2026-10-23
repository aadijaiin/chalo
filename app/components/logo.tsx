import { THEME } from '@/lib/theme';
import Svg, { Circle, Path } from 'react-native-svg';

/** The chalo mark: a location pin whose head is two travellers side by side. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 3C14.6 3 7 10.4 7 19.6 7 31.7 24 45 24 45s17-13.3 17-25.4C41 10.4 33.4 3 24 3Z"
        fill={THEME.light.primary}
      />
      <Circle cx="18.5" cy="19" r="5" fill="#fff" />
      <Circle cx="29.5" cy="19" r="5" fill="#fff" opacity={0.75} />
    </Svg>
  );
}
