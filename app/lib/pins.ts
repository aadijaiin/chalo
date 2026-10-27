import { supabase } from '@/lib/supabase';
import { MapPin, StickyNote, Users, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';

export type PinKind = 'stop' | 'meetup' | 'note';

export type Pin = {
  id: string;
  partyId: string;
  createdBy: string | null;
  kind: PinKind;
  name: string;
  note: string | null;
  lat: number;
  lng: number;
  createdAt: number;
};

type PinRow = {
  id: string;
  party_id: string;
  created_by: string | null;
  kind: PinKind;
  name: string;
  note: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

export const PIN_META: Record<PinKind, { icon: LucideIcon; label: string; hint: string }> = {
  stop: { icon: MapPin, label: 'Stop', hint: "A dhaba or fuel pump on the way. It's added to everyone's route." },
  meetup: { icon: Users, label: 'Meetup', hint: 'Where everyone regroups' },
  note: { icon: StickyNote, label: 'Note', hint: 'Something to know about this spot' },
};

export const PIN_KINDS: PinKind[] = ['stop', 'meetup', 'note'];
export const PIN_NAME_MAX = 60;
export const PIN_NOTE_MAX = 200;

function toPin(row: PinRow): Pin {
  return {
    id: row.id,
    partyId: row.party_id,
    createdBy: row.created_by,
    kind: row.kind,
    name: row.name,
    note: row.note,
    lat: row.lat,
    lng: row.lng,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function friendly(message: string) {
  if (message.includes('not_in_party')) return new Error("You're not live in this party.");
  if (message.includes('too_many_pins')) return new Error('This party already has 30 pins. Remove some first.');
  if (message.includes('pin_not_yours')) return new Error('Only whoever added this pin, or the host, can change it.');
  return new Error(message);
}

export const pins = {
  async add(partyId: string, p: { kind: PinKind; name: string; note?: string; lat: number; lng: number }) {
    const { data, error } = await supabase
      .rpc('add_pin', {
        pid: partyId,
        pin_kind: p.kind,
        pin_name: p.name,
        pin_lat: p.lat,
        pin_lng: p.lng,
        pin_note: p.note ?? null,
      })
      .single<PinRow>();
    if (error) throw friendly(error.message);
    return toPin(data);
  },

  async update(pinId: string, p: { kind: PinKind; name: string; note?: string }) {
    const { error } = await supabase.rpc('update_pin', {
      pin_id: pinId,
      pin_kind: p.kind,
      pin_name: p.name,
      pin_note: p.note ?? null,
    });
    if (error) throw friendly(error.message);
  },

  async remove(pinId: string) {
    const { error } = await supabase.rpc('remove_pin', { pin_id: pinId });
    if (error) throw friendly(error.message);
  },

  async list(partyId: string) {
    const { data, error } = await supabase
      .from('party_pins')
      .select('*')
      .eq('party_id', partyId)
      .order('created_at')
      .returns<PinRow[]>();
    if (error) throw friendly(error.message);
    return data.map(toPin);
  },
};

/** A party's pins, kept live over Realtime. Null until the first load. */
export function usePins(partyId: string) {
  const [list, setList] = React.useState<Pin[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      pins
        .list(partyId)
        .then((l) => !cancelled && setList(l))
        .catch((e) => console.warn('[pins] loading failed:', e.message));

    const channel = supabase
      .channel(`party-pins:${partyId}`)
      .on<PinRow>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_pins', filter: `party_id=eq.${partyId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const gone = (payload.old as Partial<PinRow>).id;
            setList((prev) => (prev ?? []).filter((p) => p.id !== gone));
            return;
          }
          const pin = toPin(payload.new);
          setList((prev) =>
            (prev ?? []).some((p) => p.id === pin.id)
              ? (prev ?? []).map((p) => (p.id === pin.id ? pin : p))
              : [...(prev ?? []), pin]
          );
        }
      )
      .subscribe((status) => status === 'SUBSCRIBED' && load());

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [partyId]);

  return list;
}
