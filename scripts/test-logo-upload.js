const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const email = 'logotest@barberelite.dev';
const password = 'TesteLogo@123';

async function api(u, opts = {}, token = key) {
  const res = await fetch(url + u, {
    ...opts,
    headers: { apikey: key, ...(token && token !== key ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

(async () => {
  // 1. criar usuario de teste
  let r = await api('/auth/v1/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name: 'Logo Teste' } }),
  });
  const uid = r.json?.id;
  console.log('usuario:', r.status, uid || r.json?.msg);

  // 2. promover a admin
  r = await api(`/rest/v1/profiles?select=id`, { method: 'PATCH', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ role: 'admin' }) }, null);
  // acima errado; fazer patch correto:
  r = await api(`/rest/v1/profiles?id=eq.${uid}`, { method: 'PATCH', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ role: 'admin' }) }, null);
  console.log('promover admin:', r.status);

  // 3. login como o usuario
  r = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const token = r.json?.access_token;
  console.log('login:', r.status, token ? 'OK' : r.json?.msg);

  // 4. upload de PNG de teste no bucket logos
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  r = await api('/storage/v1/object/logos/test-logo.png', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: png,
  });
  console.log('upload:', r.status, JSON.stringify(r.json));

  // 5. ler o objeto como anon (publico)
  r = await api('/storage/v1/object/public/logos/test-logo.png', { method: 'GET' });
  console.log('leitura publica:', r.status);

  // 6. update site_config
  const pub = `${url}/storage/v1/object/public/logos/test-logo.png`;
  r = await api('/rest/v1/site_config?id=eq.1', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ logo_url: pub }),
  });
  console.log('update site_config:', r.status, r.json?.message || '');

  // 7. cleanup
  await api(`/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } });
  console.log('cleanup usuario ok');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
