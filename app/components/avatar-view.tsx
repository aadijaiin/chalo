import { avatarSvg, type AvatarConfig } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

type AvatarViewProps = {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
};

export const AvatarView = React.memo(function AvatarView({
  avatar,
  size = 48,
  className,
}: AvatarViewProps) {
  const xml = React.useMemo(() => avatarSvg(avatar), [avatar.style, avatar.seed]);
  return (
    <View
      className={cn('overflow-hidden rounded-full bg-muted', className)}
      style={{ width: size, height: size }}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
});
