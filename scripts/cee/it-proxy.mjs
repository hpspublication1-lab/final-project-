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
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const jwtSecret = process.env.IT_JWT_SECRET ?? 'it-only-secret-not-for-any-real-project-0123456789';

/** Verifies an HS256 test JWT (signed with the throwaway secret) and returns its payload. */
function verifyJwt(token) {
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) return null;
  const expected = createHmac('sha256', jwtSecret).update(`${h}.${p}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  return payload.exp && payload.exp * 1000 < Date.now() ? null : payload;
}

const port = Number(process.env.IT_PROXY_PORT ?? 54331);
const upstream = new URL(process.env.POSTGREST_URL ?? 'http://127.0.0.1:54330');

// ── Object storage stand-in (private buckets only) ────────────────────────
// Mirrors the Storage API calls the app makes: signed single-use upload URLs,
// raw PUT uploads to them, server-only downloads and copies, and signed GETs.
const storageDir = process.env.IT_STORAGE_DIR ?? '/tmp/cee-it/storage';
const BUCKETS = { 'cee-quarantine': 52428800, 'cee-published': 52428800 };
const uploadTokens = new Map(); // token → { bucket, key, expires }
const objPath = (bucket, key) => {
  const p = normalize(join(storageDir, bucket, key));
  if (!p.startsWith(join(storageDir, bucket) + '/')) throw new Error('bad key');
  return p;
};
const isService = (req) => verifyJwt((req.headers.authorization ?? '').replace(/^Bearer /, ''))?.role === 'service_role';
const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(body));
};
const readBody = (req, limit, cb) => {
  const chunks = [];
  let size = 0;
  let over = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > limit) over = true;
    else chunks.push(c);
  });
  req.on('end', () => cb(over ? null : Buffer.concat(chunks)));
};
const splitKey = (rest) => {
  const i = rest.indexOf('/');
  return i < 0 ? [rest, ''] : [rest.slice(0, i), decodeURIComponent(rest.slice(i + 1))];
};

function storage(req, res, url) {
  const p = url.pathname.slice('/storage/v1'.length);
  // Signed upload URL (server only)
  let m = p.match(/^\/object\/upload\/sign\/(.+)$/);
  if (m && req.method === 'POST') {
    const [bucket, key] = splitKey(m[1]);
    if (!isService(req)) return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'service role only' });
    if (!(bucket in BUCKETS)) return json(res, 404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
    const token = randomBytes(16).toString('hex');
    uploadTokens.set(token, { bucket, key, expires: Date.now() + 2 * 3600 * 1000 });
    return json(res, 200, { url: `/object/upload/sign/${bucket}/${key}?token=${token}` });
  }
  // Upload to a signed URL (the token is the only credential), single use, no overwrite
  if (m && req.method === 'PUT') {
    const [bucket, key] = splitKey(m[1]);
    const t = uploadTokens.get(url.searchParams.get('token') ?? '');
    if (!t || t.bucket !== bucket || t.key !== key || t.expires < Date.now()) return json(res, 400, { statusCode: '403', error: 'InvalidSignature', message: 'invalid or expired upload token' });
    uploadTokens.delete(url.searchParams.get('token'));
    const file = objPath(bucket, key);
    if (existsSync(file)) return json(res, 409, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
    return readBody(req, BUCKETS[bucket], (body) => {
      if (!body) return json(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, body);
      writeFileSync(file + '.type', req.headers['content-type'] ?? 'application/octet-stream');
      json(res, 200, { Key: `${bucket}/${key}` });
    });
  }
  // Copy between buckets (server only), no overwrite
  if (p === '/object/copy' && req.method === 'POST') {
    if (!isService(req)) return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'service role only' });
    return readBody(req, 64 * 1024, (body) => {
      const { bucketId, sourceKey, destinationKey, destinationBucket } = JSON.parse(String(body || '{}'));
      const from = objPath(bucketId, sourceKey);
      const to = objPath(destinationBucket ?? bucketId, destinationKey);
      if (!existsSync(from)) return json(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      if (existsSync(to)) return json(res, 409, { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' });
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, readFileSync(from));
      writeFileSync(to + '.type', readFileSync(from + '.type'));
      json(res, 200, { Key: `${destinationBucket ?? bucketId}/${destinationKey}` });
    });
  }
  // Single signed download URL (server only)
  m = p.match(/^\/object\/sign\/([^/]+)\/(.+)$/);
  if (m && req.method === 'POST') {
    if (!isService(req)) return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'service role only' });
    return json(res, 200, { signedURL: `/object/sign/${m[1]}/${m[2]}?token=it-test-token` });
  }
  // Signed GET of a stored object
  if (m && req.method === 'GET' && existsSync(objPath(m[1], decodeURIComponent(m[2])))) {
    const file = objPath(m[1], decodeURIComponent(m[2]));
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': String(readFileSync(file + '.type')), 'content-length': body.length, 'access-control-allow-origin': '*' });
    return res.end(body);
  }
  // Authenticated download (server only)
  m = p.match(/^\/object\/(cee-[a-z]+)\/(.+)$/);
  if (m && req.method === 'GET') {
    if (!isService(req)) return json(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'service role only' });
    const file = objPath(m[1], decodeURIComponent(m[2]));
    if (!existsSync(file)) return json(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': String(readFileSync(file + '.type')), 'content-length': body.length });
    return res.end(body);
  }
  return false;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (req.method !== 'OPTIONS' && url.pathname.startsWith('/storage/v1/') && storage(req, res, url) !== false) return;

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
      'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
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
    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    const m = token.match(/^it-user\.([0-9a-f-]{36})$/);
    const jwt = m ? null : verifyJwt(token);
    const user = m ? fakeUser(m[1]) : jwt?.sub ? { ...fakeUser(jwt.sub), email: jwt.email ?? fakeUser(jwt.sub).email } : null;
    res.writeHead(user ? 200 : 401, { 'content-type': 'application/json' });
    res.end(JSON.stringify(user ?? { msg: 'not a test token' }));
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
