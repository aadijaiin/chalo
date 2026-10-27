import { PIN_COLORS } from '@/components/map/pin-marker';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { RouteTo } from '@/hooks/use-route-to';
import { confirm } from '@/lib/confirm';
import { formatDuration, formatKm, timeAgo } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { distanceM } from '@/lib/location';
import { motion } from '@/lib/motion';
import { notify } from '@/lib/notify';
import { PIN_META, pins, type Pin } from '@/lib/pins';
import { Navigation, Pencil, Trash2, X } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/** A shared pin up close: what it is, who added it, and a route there. */
export function PinSheet({
  pin,
  addedBy,
  canEdit,
  me,
  route,
  onToggleRoute,
  onEdit,
  onClose,
}: {
  pin: Pin;
  addedBy: string;
  canEdit: boolean;
  me: { latitude: number; longitude: number } | null;
  route: RouteTo;
  onToggleRoute: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const meta = PIN_META[pin.kind];
  const color = PIN_COLORS[pin.kind];
  const away = me ? distanceM(me, { latitude: pin.lat, longitude: pin.lng }) : null;
  const routing = route.status !== 'off';
  const [removing, setRemoving] = React.useState(false);

  async function remove() {
    const ok = await confirm({
      title: `Remove ${pin.name}?`,
      message: 'It disappears from everyone’s map.',
      confirmLabel: 'Remove pin',
      destructive: true,
      icon: Trash2,
    });
    if (!ok) return;
    setRemoving(true);
    try {
      await pins.remove(pin.id);
      haptics.success();
      onClose();
    } catch (e) {
      notify.error("Couldn't remove it", (e as Error).message);
      setRemoving(false);
    }
  }

  return (
    <Animated.View
      entering={motion.sheetIn}
      exiting={motion.sheetOut}
      className="mx-3 gap-4 rounded-3xl bg-card p-4 shadow-xl shadow-black/15">
      <View className="flex-row items-start gap-3">
        <View className="rounded-2xl p-3" style={{ backgroundColor: color }}>
          <Icon as={meta.icon} size={20} className="text-white" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            {meta.label}
          </Text>
          <Text className="text-lg font-bold" numberOfLines={2}>
            {pin.name}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Added by {addedBy} · {timeAgo(pin.createdAt)}
            {away != null ? ` · ${formatKm(away)} from you` : ''}
          </Text>
        </View>
        <PressableScale
          onPress={onClose}
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon as={X} size={18} />
        </PressableScale>
      </View>

      {pin.note ? (
        <View className="rounded-2xl bg-muted/60 px-3 py-2.5">
          <Text className="text-sm">{pin.note}</Text>
        </View>
      ) : null}

      {routing ? (
        <Animated.View entering={FadeIn} className="flex-row items-center gap-3 rounded-2xl border border-border px-3 py-2.5">
          <View className="rounded-xl p-2" style={{ backgroundColor: color }}>
            <Icon as={Navigation} size={16} className="text-white" />
          </View>
          <View className="flex-1">
            {route.status === 'ready' ? (
              <>
                <Text className="font-bold">
                  {formatKm(route.remainingM)} · {formatDuration(route.remainingS)}
                </Text>
                <Text className="text-xs text-muted-foreground">to get there</Text>
              </>
            ) : route.status === 'together' ? (
              <Text className="font-bold">You're here</Text>
            ) : route.status === 'error' ? (
              <Text className="text-sm text-muted-foreground">{route.message}</Text>
            ) : (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-muted-foreground">Finding a route…</Text>
              </View>
            )}
          </View>
        </Animated.View>
      ) : null}

      <View className="flex-row gap-2">
        <Button className="flex-1" disabled={!me} onPress={onToggleRoute} variant={routing ? 'secondary' : 'default'}>
          <Icon as={Navigation} size={16} className={routing ? 'text-foreground' : 'text-primary-foreground'} />
          <Text>{routing ? 'Stop route' : 'Route there'}</Text>
        </Button>
        {canEdit ? (
          <>
            <Button variant="outline" onPress={onEdit} accessibilityLabel="Edit pin">
              <Icon as={Pencil} size={16} className="text-foreground" />
            </Button>
            <Button variant="outline" loading={removing} onPress={remove} accessibilityLabel="Remove pin">
              <Icon as={Trash2} size={16} className="text-destructive" />
            </Button>
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}
