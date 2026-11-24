/**
 * Integration-test stand-in for a Supabase project URL.
 *
 *   /rest/v1/*                      → a real PostgREST (POSTGREST_URL)
 *   POST /storage/v1/object/sign/…  → fake signer: returns test URLs, never real ones
 *   GET  /storage/v1/object/sign/…  → serves the committed dev-fixture files
 *   /auth/v1/user, /auth/v1/admin/users/:id
 *                                   → fake sign-in for tokens "it-user.<uuid>"
 *
 * Used only by scripts/cee/it-setup.sh and the API integration test.
 */
import http from 'node:http';
import { readFileSync } from 'node:fs';

const port = Number(process.env.IT_PROXY_PORT ?? 54331);
const upstream = new URL(process.env.POSTGREST_URL ?? 'http://127.0.0.1:54330');

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');

  const sign = url.pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)$/);
  if (sign && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { paths = [] } = JSON.parse(body || '{}');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(paths.map((p) => ({ error: null, path: p, signedURL: `/object/sign/${sign[1]}/${p}?token=it-test-token` }))));
    });
    return;
  }

  // CORS preflight, as Supabase Storage answers it (test browsers add headers that trigger one).
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  // Signed-URL downloads: the model and fallback are the committed dev fixture.
  if (req.method === 'GET' && url.pathname.startsWith('/storage/v1/object/sign/cee-published/')) {
    const file = url.pathname.includes('/published/f/') ? 'fallback.svg' : 'fixture.glb';
    const body = readFileSync(`public/cee-dev-fixture/${file}`);
    res.writeHead(200, {
      'content-type': file.endsWith('.svg') ? 'image/svg+xml' : 'model/gltf-binary',
      'content-length': body.length,
      'access-control-allow-origin': '*',
    });
    res.end(body);
    return;
  }

  // Fake auth: a test token names the user. Nothing else is accepted.
  const fakeUser = (id) => ({
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `${id}@test.invalid`,
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-11-01T00:00:00Z',
  });
  if (url.pathname === '/auth/v1/user') {
    const m = (req.headers.authorization ?? '').match(/^Bearer it-user\.([0-9a-f-]{36})$/);
    res.writeHead(m ? 200 : 401, { 'content-type': 'application/json' });
    res.end(JSON.stringify(m ? fakeUser(m[1]) : { msg: 'not a test token' }));
    return;
  }
  const admin = url.pathname.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/);
  if (admin) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(fakeUser(admin[1])));
    return;
  }

  if (!url.pathname.startsWith('/rest/v1')) {
    res.writeHead(404).end();
    return;
  }
  const target = new URL(url.pathname.slice('/rest/v1'.length) + url.search, upstream);
  const headers = { ...req.headers, host: upstream.host };
  const proxied = http.request(target, { method: req.method, headers }, (up) => {
    res.writeHead(up.statusCode ?? 502, up.headers);
    up.pipe(res);
  });
  proxied.on('error', (e) => {
    res.writeHead(502).end(String(e));
  });
  req.pipe(proxied);
});

server.listen(port, '127.0.0.1', () => console.log(`it-proxy on :${port} → ${upstream.href}`));
