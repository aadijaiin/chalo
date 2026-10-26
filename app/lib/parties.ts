import type { AvatarConfig, AvatarStyle } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';

export const CODE_LENGTH = 6;

export type Party = {
  id: string;
  code: string;
  name: string;
  hostId: string;
  createdAt: string;
  endedAt: string | null;
};

export type PartyMember = {
  userId: string;
  username: string;
  fullName: string;
  avatar: AvatarConfig;
  joinedAt: string;
  leftAt: string | null;
};

/** A party from the user's history, with who's in it for the avatar stack. */
export type PartySummary = Party & { members: PartyMember[]; leftAt: string | null };

type PartyRow = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  created_at: string;
  ended_at: string | null;
};

type MemberRow = {
  user_id: string;
  joined_at: string;
  left_at: string | null;
  profiles: { username: string; full_name: string; avatar_style: string; avatar_seed: string } | null;
};

const MEMBER_COLUMNS = 'user_id, joined_at, left_at, profiles(username, full_name, avatar_style, avatar_seed)';

function toParty(row: PartyRow): Party {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    hostId: row.host_id,
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}

function toMember(row: MemberRow): PartyMember {
  return {
    userId: row.user_id,
    username: row.profiles?.username ?? '',
    fullName: row.profiles?.full_name ?? '',
    avatar: {
      style: (row.profiles?.avatar_style as AvatarStyle) ?? 'adventurer',
      seed: row.profiles?.avatar_seed ?? row.user_id,
    },
    joinedAt: row.joined_at,
    leftAt: row.left_at,
  };
}

export function normalizeCode(raw: string) {
  return raw.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, CODE_LENGTH);
}

export function inviteMessage(party: Party) {
  return `Join my chalo party "${party.name}" 🚗\nCode: ${party.code}\nchalo://join/${party.code}`;
}

export type PartyLocation = {
  userId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  updatedAt: number;
};

export type LocationRow = {
  party_id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  updated_at: string;
};

export function toLocation(row: LocationRow): PartyLocation {
  return {
    userId: row.user_id,
    lat: row.lat,
    lng: row.lng,
    accuracy: row.accuracy,
    speed: row.speed,
    heading: row.heading,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/** Thrown by create/join when you're already live in another party; retry with replace once the user agrees. */
export class PartyConflictError extends Error {
  constructor(
    public partyName: string,
    public role: 'host' | 'member'
  ) {
    super(`You're already in ${partyName}`);
  }
}

type RpcError = { message: string; details?: string | null; hint?: string | null };

/** Turns RPC errors into something a person can act on. */
function friendlyError(error: RpcError) {
  if (error.message.includes('in_another_party')) {
    return new PartyConflictError(error.details ?? 'another party', error.hint === 'host' ? 'host' : 'member');
  }
  if (error.message.includes('party_not_found')) return new Error("No live party with that code. Check it with the host.");
  if (error.message.includes('Could not find the function')) return new Error('Parties aren\'t set up on the server yet.');
  return new Error(error.message);
}

export const parties = {
  async create(name: string, replaceCurrent = false) {
    const { data, error } = await supabase
      .rpc('create_party', { party_name: name, replace_current: replaceCurrent })
      .single<PartyRow>();
    if (error) throw friendlyError(error);
    return toParty(data);
  },

  async join(code: string, replaceCurrent = false) {
    const { data, error } = await supabase
      .rpc('join_party', { party_code: normalizeCode(code), replace_current: replaceCurrent })
      .single<PartyRow>();
    if (error) throw friendlyError(error);
    return toParty(data);
  },

  async leave(partyId: string) {
    const { error } = await supabase.rpc('leave_party', { pid: partyId });
    if (error) throw friendlyError(error);
  },

  async end(partyId: string) {
    const { error } = await supabase.rpc('end_party', { pid: partyId });
    if (error) throw friendlyError(error);
  },

  async get(partyId: string) {
    const { data, error } = await supabase.from('parties').select('*').eq('id', partyId).maybeSingle<PartyRow>();
    if (error) throw friendlyError(error);
    return data ? toParty(data) : null;
  },

  async members(partyId: string) {
    const { data, error } = await supabase
      .from('party_members')
      .select(MEMBER_COLUMNS)
      .eq('party_id', partyId)
      .order('joined_at')
      .returns<MemberRow[]>();
    if (error) throw friendlyError(error);
    return data.map(toMember);
  },

  /** The live party you're currently in, if any. */
  async current(userId: string) {
    const { data, error } = await supabase
      .from('party_members')
      .select('joined_at, parties!inner(*)')
      .eq('user_id', userId)
      .is('left_at', null)
      .is('parties.ended_at', null)
      .order('joined_at', { ascending: false })
      .limit(1)
      .returns<{ parties: PartyRow }[]>();
    if (error) throw friendlyError(error);
    return data[0] ? toParty(data[0].parties) : null;
  },

  async locations(partyId: string) {
    const { data, error } = await supabase
      .from('party_locations')
      .select('*')
      .eq('party_id', partyId)
      .returns<LocationRow[]>();
    if (error) throw friendlyError(error);
    return data.map(toLocation);
  },

  /** Returns false when you're no longer live in this party, so the caller should stop sharing. */
  async shareLocation(
    partyId: string,
    c: { latitude: number; longitude: number; accuracy: number | null; speed: number | null; heading: number | null }
  ) {
    const { data, error } = await supabase.rpc('share_location', {
      pid: partyId,
      lat: c.latitude,
      lng: c.longitude,
      accuracy: c.accuracy,
      speed: c.speed != null && c.speed >= 0 ? c.speed : null,
      heading: c.heading != null && c.heading >= 0 ? c.heading : null,
    });
    if (error) throw friendlyError(error);
    return data as boolean;
  },

  /** Every party the user has been in, newest first. RLS limits rows to those. */
  async mine(userId: string, limit = 10): Promise<PartySummary[]> {
    const { data, error } = await supabase
      .from('parties')
      .select(`*, party_members(${MEMBER_COLUMNS})`)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<(PartyRow & { party_members: MemberRow[] })[]>();
    if (error) throw friendlyError(error);
    return data.map((row) => {
      const members = row.party_members.map(toMember);
      return {
        ...toParty(row),
        members,
        leftAt: members.find((m) => m.userId === userId)?.leftAt ?? null,
      };
    });
  },
};
