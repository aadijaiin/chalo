// Who-can-see-what tests for chalo's privacy rules, run against a real Supabase project through
// the public API (the same calls the app makes). Creates throwaway accounts and deletes them
// afterwards with delete_my_account().
//
//   SUPABASE_URL=… SUPABASE_KEY=… node --test backend/tests/*.test.mjs
//
// Falls back to EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY from app/.env.
// Needs email confirmation off (the setting the backend README recommends for development).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';

function env() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    const file = readFileSync(new URL('../../app/.env', import.meta.url), 'utf8');
    const get = (name) => file.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
    url ??= get('EXPO_PUBLIC_SUPABASE_URL');
    key ??= get('EXPO_PUBLIC_SUPABASE_KEY');
  }
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_KEY');
  return { url, key };
}

const { url: URL_, key: KEY } = env();
const RUN = Math.random().toString(36).slice(2, 8);
const PASSWORD = `access-test-${RUN}!`;

async function call(method, path, body, token) {
  const res = await fetch(URL_ + path, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${token ?? KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message ?? `${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const rpc = (fn, args, user) => call('POST', `/rest/v1/rpc/${fn}`, args, user?.token);
const select = (path, user) => call('GET', `/rest/v1/${path}`, undefined, user.token);

async function signUp(name) {
  const data = await call('POST', '/auth/v1/signup', {
    email: `access-${RUN}-${name}@chalo.test`,
    password: PASSWORD,
    data: { username: `t_${RUN}_${name}`.slice(0, 20), full_name: `Test ${name}`, avatar_seed: name },
  });
  assert.ok(data.access_token, 'sign up returned no session; turn off email confirmation');
  return { name, token: data.access_token, id: data.user.id };
}

async function share(user, partyId, lat, lng) {
  return rpc('share_location', { pid: partyId, lat, lng, eta_s: 600, remaining_m: 9000 }, user);
}

async function visibleLocations(user, partyId) {
  const rows = await select(`party_locations?party_id=eq.${partyId}&select=user_id`, user);
  return new Set(rows.map((r) => r.user_id));
}

const rejects = (promise, pattern) => assert.rejects(promise, (e) => pattern.test(e.message));

describe('party privacy', () => {
  let host, crew, lookout, outsider, rider, party;

  before(async () => {
    [host, crew, lookout, outsider, rider] = await Promise.all(['host', 'crew', 'lookout', 'outsider', 'rider'].map(signUp));
    party = await rpc('create_party', { party_name: `Access test ${RUN}`, replace_current: true }, host);
    await rpc('set_destination', { pid: party.id, dest_name: 'Test point', dest_lat: 18.75, dest_lng: 73.4 }, host);
    await rpc('join_party', { party_code: party.code, replace_current: true }, crew);
    await rpc('join_party', { party_code: party.code, as_lookout: true }, lookout);
    await rpc('join_party', { party_code: party.code, replace_current: true }, rider);
    await share(host, party.id, 18.9, 73.1);
    await share(crew, party.id, 18.95, 73.05);
    await rpc('send_ping', { pid: party.id, kind: 'chai' }, crew);
    await rpc('add_pin', { pid: party.id, pin_kind: 'stop', pin_name: 'Chai', pin_lat: 18.9, pin_lng: 73.2 }, crew);
  });

  after(async () => {
    for (const user of [host, crew, lookout, outsider, rider]) {
      if (user) await rpc('delete_my_account', {}, user).catch(() => {});
    }
  });

  test('a lookout sees nothing until the host approves them', async () => {
    const pings = () => select(`party_pings?party_id=eq.${party.id}&select=id`, lookout);
    const pins = () => select(`party_pins?party_id=eq.${party.id}&select=id`, lookout);
    assert.equal((await visibleLocations(lookout, party.id)).size, 0);
    assert.equal((await pings()).length, 0);
    assert.equal((await pins()).length, 0);

    await rejects(rpc('approve_lookout', { pid: party.id, uid: lookout.id }, crew), /Only the host/);
    await rpc('approve_lookout', { pid: party.id, uid: lookout.id }, host);
    assert.equal((await pings()).length, 1);
    assert.equal((await pins()).length, 1);
  });

  test('crew and lookouts see the crew; outsiders see nothing', async () => {
    assert.deepEqual(await visibleLocations(crew, party.id), new Set([host.id, crew.id]));
    assert.deepEqual(await visibleLocations(lookout, party.id), new Set([host.id, crew.id]));
    assert.equal((await visibleLocations(outsider, party.id)).size, 0);
  });

  test("a lookout can't share, ping or pin", async () => {
    assert.equal(await share(lookout, party.id, 19, 73), null);
    assert.ok(!(await visibleLocations(host, party.id)).has(lookout.id));
    await rejects(rpc('send_ping', { pid: party.id, kind: 'chai' }, lookout), /not_in_party/);
    await rejects(
      rpc('add_pin', { pid: party.id, pin_kind: 'stop', pin_name: 'x', pin_lat: 19, pin_lng: 73 }, lookout),
      /not_in_party/
    );
  });

  test('someone hidden from lookouts is invisible to lookouts and watch links only', async () => {
    await rpc('set_hidden_from_lookouts', { pid: party.id, hidden: true }, crew);
    assert.ok(!(await visibleLocations(lookout, party.id)).has(crew.id));
    assert.ok((await visibleLocations(host, party.id)).has(crew.id));

    await rejects(rpc('create_watch_link', { pid: party.id }, lookout), /Only the host/);
    await rejects(rpc('create_watch_link', { pid: party.id }, crew), /Only the host/);
    const token = await rpc('create_watch_link', { pid: party.id }, host);
    const watched = await rpc('watch_party', { token });
    // Avatar seeds are the account names given at sign up ('host', 'crew', ...).
    const seeds = watched.crew.map((m) => m.avatarSeed);
    assert.ok(seeds.includes('host'), 'the host is on the watch link');
    assert.ok(!seeds.includes('crew'), 'the hidden crew member is left out');
    assert.ok(watched.crew.every((m) => !('userId' in m)), 'no account ids on a public link');

    await rpc('set_hidden_from_lookouts', { pid: party.id, hidden: false }, crew);
    assert.ok((await visibleLocations(lookout, party.id)).has(crew.id));
  });

  test('only the host can turn off a watch link, and then it shows nothing', async () => {
    const token = await rpc('create_watch_link', { pid: party.id }, host);
    await rejects(rpc('revoke_watch_link', { pid: party.id }, crew), /Only the host/);
    await rpc('revoke_watch_link', { pid: party.id }, host);
    assert.equal(await rpc('watch_party', { token }), null);
  });

  test("a removed lookout loses the feed and can't come back", async () => {
    await rejects(rpc('remove_lookout', { pid: party.id, uid: lookout.id }, crew), /Only the host/);
    await rpc('remove_lookout', { pid: party.id, uid: lookout.id }, host);
    assert.equal((await visibleLocations(lookout, party.id)).size, 0);
    await rejects(rpc('join_party', { party_code: party.code, as_lookout: true }, lookout), /removed_from_party/);
    await rejects(rpc('join_party', { party_code: party.code, replace_current: true }, lookout), /removed_from_party/);
  });

  test('the host can remove someone from the crew, and they stay out', async () => {
    await share(rider, party.id, 18.97, 73.02);
    assert.ok((await visibleLocations(host, party.id)).has(rider.id));

    await rejects(rpc('remove_member', { pid: party.id, uid: rider.id }, crew), /Only the host/);
    await rejects(rpc('remove_member', { pid: party.id, uid: host.id }, host), /cannot_remove_host/);
    await rpc('remove_member', { pid: party.id, uid: rider.id }, host);

    assert.ok(!(await visibleLocations(host, party.id)).has(rider.id), 'their position is off the map');
    assert.equal(await share(rider, party.id, 18.97, 73.02), null, 'their phone is told to stop sharing');
    assert.equal((await visibleLocations(rider, party.id)).size, 0, 'they no longer see anyone');
    await rejects(rpc('join_party', { party_code: party.code, replace_current: true }, rider), /removed_from_party/);
    await rejects(rpc('join_party', { party_code: party.code, as_lookout: true }, rider), /removed_from_party/);
  });

  test('leaving cuts off live positions', async () => {
    await rpc('leave_party', { pid: party.id }, crew);
    assert.equal((await visibleLocations(crew, party.id)).size, 0);
  });

  test('an ended party: no live positions, trails for members, a stats-only recap card for anyone', async () => {
    await rpc('end_party', { pid: party.id }, host);
    assert.equal((await visibleLocations(host, party.id)).size, 0);

    const trails = await select(`party_track_points?party_id=eq.${party.id}&select=user_id`, crew);
    assert.ok(trails.length > 0, 'past members can see trails for the recap');
    assert.equal((await select(`party_track_points?party_id=eq.${party.id}&select=user_id`, outsider)).length, 0);

    const token = await rpc('share_recap', { pid: party.id }, crew);
    const card = await rpc('recap_card', { token });
    assert.equal(card.name, `Access test ${RUN}`);
    assert.ok(card.crew.every((m) => !('lat' in m) && !('lng' in m)), 'no positions on the card');
    assert.equal(await rpc('recap_card', { token: 'nope' }), null);
  });

  test('anyone can report an app error, signed in or not', async () => {
    await rpc('report_error', { message: `access test ${RUN}`, platform: 'test' });
    await rpc('report_error', { message: `access test ${RUN}`, platform: 'test' }, crew);
    // Nobody can read the reports back through the API.
    assert.equal((await select('app_errors?select=id', crew)).length, 0);
  });
});
