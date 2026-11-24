import { describe, expect, it } from 'vitest';
import { SeenIds, makeOutbound, parseBridgeMessage, postToHost } from '../bridge';
import { CeeApiError, fail, mapDbError, ok } from '../http';
import { initialPlayerState, playerReducer, shows3D, showsFallback, type PlayerAction, type PlayerState } from '../playerMachine';
import { U } from './fixtures';

const run = (actions: PlayerAction[], from: PlayerState = initialPlayerState) => actions.reduce(playerReducer, from);
const open3d = { type: 'OPEN', webgl: true, mode: '3d', hasFallback: true } as const;

describe('player state machine', () => {
  it('loads, becomes ready, and goes between ready and interacting', () => {
    expect(run([open3d]).name).toBe('LOADING');
    expect(run([open3d, { type: 'LOADED' }]).name).toBe('READY');
    expect(run([open3d, { type: 'LOADED' }, { type: 'INPUT' }]).name).toBe('INTERACTING');
    expect(run([open3d, { type: 'LOADED' }, { type: 'INPUT' }, { type: 'IDLE' }]).name).toBe('READY');
  });

  it('goes straight to the fallback without WebGL', () => {
    const s = run([{ ...open3d, webgl: false }]);
    expect(s).toMatchObject({ name: 'FALLBACK', fallbackReason: 'NO_WEBGL' });
    expect(showsFallback(s)).toBe(true);
    expect(shows3D(s)).toBe(false);
  });

  it('moves from a load error to the fallback', () => {
    const s = run([open3d, { type: 'LOAD_FAILED', code: 'HTTP_403' }]);
    expect(s).toMatchObject({ name: 'ERROR', errorCode: 'HTTP_403' });
    expect(run([{ type: 'SHOW_FALLBACK', reason: 'LOAD_FAILED' }], s).name).toBe('FALLBACK');
  });

  it('stays in ERROR when there is no fallback to show', () => {
    const s = run([{ ...open3d, hasFallback: false, webgl: false }]);
    expect(s.name).toBe('ERROR');
  });

  it('recovers from one context loss and falls back on the second', () => {
    const lost = run([open3d, { type: 'LOADED' }, { type: 'CONTEXT_LOST' }]);
    expect(lost.name).toBe('CONTEXT_LOST');
    const back = run([{ type: 'CONTEXT_RESTORED' }, { type: 'RECOVERED' }], lost);
    expect(back.name).toBe('READY');
    const second = run([{ type: 'CONTEXT_LOST' }], back);
    expect(second).toMatchObject({ name: 'FALLBACK', fallbackReason: 'CONTEXT_LOST', contextLosses: 2 });
  });

  it('falls back when recovery times out', () => {
    const s = run([open3d, { type: 'LOADED' }, { type: 'CONTEXT_LOST' }, { type: 'CONTEXT_RESTORED' }, { type: 'RECOVERY_TIMEOUT' }]);
    expect(s.name).toBe('FALLBACK');
  });

  it('completes only on server confirmation, from 3D or the fallback', () => {
    expect(run([open3d, { type: 'LOADED' }, { type: 'SERVER_COMPLETED' }]).name).toBe('COMPLETED');
    expect(run([{ ...open3d, webgl: false }, { type: 'SERVER_COMPLETED' }]).name).toBe('COMPLETED');
    expect(run([open3d, { type: 'SERVER_COMPLETED' }]).name).toBe('LOADING'); // not while loading
  });

  it('keeps showing whichever view the student completed in', () => {
    const in3d = run([open3d, { type: 'LOADED' }, { type: 'SERVER_COMPLETED' }]);
    expect([shows3D(in3d), showsFallback(in3d)]).toEqual([true, false]);
    const in2d = run([{ ...open3d, webgl: false }, { type: 'SERVER_COMPLETED' }]);
    expect([shows3D(in2d), showsFallback(in2d)]).toEqual([false, true]);
  });

  it('lets a student who chose 2D go back to 3D, but not a device without WebGL', () => {
    const chose = run([open3d, { type: 'LOADED' }, { type: 'SHOW_FALLBACK', reason: 'USER_CHOICE' }]);
    expect(run([{ type: 'TRY_3D' }], chose).name).toBe('LOADING');
    const noGl = run([{ ...open3d, webgl: false }, { type: 'TRY_3D' }]);
    expect(noGl.name).toBe('FALLBACK');
  });

  it('ignores events that do not apply', () => {
    expect(run([{ type: 'LOADED' }]).name).toBe('IDLE');
    expect(run([open3d, open3d]).name).toBe('LOADING');
  });
});

describe('mobile bridge', () => {
  const inbound = (type: string, payload: object = {}, id = U(5)) => JSON.stringify({ protocolVersion: 1, messageId: id, type, payload });

  it('accepts app messages in the WebView and drops duplicates', () => {
    const seen = new SeenIds();
    expect(parseBridgeMessage(inbound('APP_PAUSED'), seen, 'webview').ok).toBe(true);
    expect(parseBridgeMessage(inbound('APP_PAUSED'), seen, 'webview')).toEqual({ ok: false, reason: 'DUPLICATE' });
  });

  it('rejects messages going the wrong way, unknown types and other versions', () => {
    const seen = new SeenIds();
    expect(parseBridgeMessage(inbound('PLAYER_READY', { mode: '3d' }), seen, 'webview')).toEqual({ ok: false, reason: 'WRONG_DIRECTION' });
    expect(parseBridgeMessage(inbound('NAVIGATE', { url: 'https://evil.example' }, U(6)), seen, 'webview')).toEqual({ ok: false, reason: 'INVALID' });
    expect(parseBridgeMessage(JSON.stringify({ protocolVersion: 2, messageId: U(7), type: 'APP_PAUSED', payload: {} }), seen, 'webview').ok).toBe(false);
    expect(parseBridgeMessage('not json', seen, 'webview')).toEqual({ ok: false, reason: 'NOT_JSON' });
    expect(parseBridgeMessage('x'.repeat(17 * 1024), seen, 'webview')).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });

  it('builds valid outbound messages and posts only to a known host', () => {
    const m = makeOutbound('SEQUENCE_COMPLETED', { sequenceKey: 'tour' });
    expect(m.protocolVersion).toBe(1);
    const sent: string[] = [];
    expect(postToHost({ ReactNativeWebView: { postMessage: (d: string) => sent.push(d) } }, m)).toBe(true);
    expect(JSON.parse(sent[0]).type).toBe('SEQUENCE_COMPLETED');
    expect(postToHost({}, m)).toBe(false);
  });

  it('bounds memory of seen ids', () => {
    const seen = new SeenIds(2);
    expect(seen.first('a')).toBe(true);
    seen.first('b');
    seen.first('c');
    expect(seen.first('a')).toBe(true); // forgotten after the limit
  });
});

describe('http envelope and database error mapping', () => {
  it('wraps data and errors with a request id', async () => {
    const r = ok({ x: 1 }, 'req_1');
    expect(await r.json()).toEqual({ data: { x: 1 }, meta: { requestId: 'req_1' } });
    expect(r.headers.get('cache-control')).toBe('no-store');
    const f = fail(new CeeApiError('NOT_FOUND'), 'req_2');
    expect(f.status).toBe(404);
    expect((await f.json()).error.code).toBe('NOT_FOUND');
  });

  it('maps the schema’s own exceptions to API codes', () => {
    expect(mapDbError({ message: 'SOD_VIOLATION: the author cannot publish' }).code).toBe('SOD_VIOLATION');
    expect(mapDbError({ message: 'ACADEMIC_APPROVAL_REQUIRED: gate RIGHTS not approved' }).code).toBe('ACADEMIC_APPROVAL_REQUIRED');
    expect(mapDbError({ message: 'ASSET_APPROVAL_REQUIRED: VISUAL on x' }).code).toBe('ACADEMIC_APPROVAL_REQUIRED');
    expect(mapDbError({ message: 'IMMUTABLE_REVISION: create a new revision instead' }).code).toBe('STATE_CONFLICT');
    expect(mapDbError({ message: 'CURRICULUM_CYCLE' }).code).toBe('CURRICULUM_INVALID');
    expect(mapDbError({ message: 'FALLBACK_REQUIRED' }).status).toBe(422);
  });

  it('never leaks unknown database errors', () => {
    const e = mapDbError({ message: 'relation "secret_table" violates something', code: 'XX000' });
    expect(e.code).toBe('INTERNAL');
    expect(JSON.stringify(e.details)).not.toContain('secret_table');
    expect(mapDbError({ code: 'PGRST205', message: 'Could not find the table' }).code).toBe('NOT_FOUND');
  });
});
