import { PIN_COLORS } from '@/components/map/pin-marker';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { motion } from '@/lib/motion';
import { notify } from '@/lib/notify';
import { PIN_KINDS, PIN_META, PIN_NAME_MAX, PIN_NOTE_MAX, pins, type Pin, type PinKind } from '@/lib/pins';
import { nameForPoint } from '@/lib/places';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PinDraft = { lat: number; lng: number; kind?: PinKind; name?: string };

/** Drops a new pin where you long-pressed (or edits an existing one): pick a kind, name it, add a note. */
export function PinEditor({
  partyId,
  draft,
  existing,
  onDone,
  onClose,
}: {
  partyId: string;
  draft?: PinDraft;
  existing?: Pin;
  onDone: (pin?: Pin) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme().colorScheme ?? 'light';
  const [kind, setKind] = React.useState<PinKind>(existing?.kind ?? draft?.kind ?? 'stop');
  const [name, setName] = React.useState(existing?.name ?? draft?.name ?? '');
  const [note, setNote] = React.useState(existing?.note ?? '');
  const [naming, setNaming] = React.useState(!existing && !draft?.name);
  const [saving, setSaving] = React.useState(false);
  const edited = React.useRef(false);

  // Suggest a name for a fresh pin from the spot itself; don't overwrite anything you typed.
  React.useEffect(() => {
    if (existing || draft?.name || !draft) return;
    nameForPoint(draft.lat, draft.lng).then((n) => {
      if (n && !edited.current) setName(n.slice(0, PIN_NAME_MAX));
      setNaming(false);
    });
  }, []);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (existing) {
        await pins.update(existing.id, { kind, name, note });
        onDone();
      } else if (draft) {
        onDone(await pins.add(partyId, { kind, name, note, lat: draft.lat, lng: draft.lng }));
      }
      haptics.success();
    } catch (e) {
      haptics.error();
      notify.error("Couldn't save the pin", (e as Error).message);
      setSaving(false);
    }
  }

  const inputClass = 'rounded-2xl border border-border bg-background px-4 py-3 font-sans text-base text-foreground';

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={motion.fade()} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable onPress={onClose} accessibilityLabel="Close" style={StyleSheet.absoluteFill} className="bg-black/30" />
      </Animated.View>
      <KeyboardAvoidingView behavior="padding" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Animated.View
          entering={motion.sheetIn}
          exiting={motion.sheetOut}
          style={{ paddingBottom: insets.bottom + 16 }}
          className="gap-4 rounded-t-3xl bg-card px-5 pt-3 shadow-xl shadow-black/20">
          <View className="h-1 w-10 self-center rounded-full bg-border" />
          <Text className="text-lg font-bold">{existing ? 'Edit pin' : 'Drop a pin'}</Text>

          <View className="flex-row gap-2">
            {PIN_KINDS.map((k) => {
              const on = k === kind;
              return (
                <PressableScale
                  key={k}
                  onPress={() => {
                    haptics.select();
                    setKind(k);
                  }}
                  className={cn('flex-1 items-center gap-1.5 rounded-2xl border p-3', on ? 'border-transparent' : 'border-border')}
                  style={on ? { backgroundColor: PIN_COLORS[k] } : undefined}>
                  <Icon as={PIN_META[k].icon} size={18} className={on ? 'text-white' : 'text-muted-foreground'} />
                  <Text className={cn('text-sm font-semibold', on && 'text-white')}>{PIN_META[k].label}</Text>
                </PressableScale>
              );
            })}
          </View>
          <Text className="-mt-2 text-xs text-muted-foreground">{PIN_META[kind].hint}</Text>

          <TextInput
            value={name}
            onChangeText={(t) => {
              edited.current = true;
              setName(t);
            }}
            maxLength={PIN_NAME_MAX}
            placeholder={naming ? 'Finding this spot…' : 'Name it, e.g. Murthal dhaba'}
            placeholderTextColor={THEME[scheme].mutedForeground}
            className={inputClass}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={PIN_NOTE_MAX}
            placeholder="Add a note (optional)"
            placeholderTextColor={THEME[scheme].mutedForeground}
            multiline
            className={cn(inputClass, 'max-h-24')}
          />

          <Button size="lg" loading={saving} disabled={!name.trim() || saving} onPress={save}>
            <Text>{existing ? 'Save changes' : `Add ${PIN_META[kind].label.toLowerCase()}`}</Text>
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
