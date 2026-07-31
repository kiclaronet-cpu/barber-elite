const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

async function api(u, opts = {}, token) {
  const res = await fetch(url + u, {
    ...opts,
    headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

(async () => {
  // login barbeiro
  let r = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'barbeiroteste@gmail.com', password: 'Teste@12345' }),
  });
  const token = r.json?.access_token;
  console.log('login barbeiro:', r.status, token ? 'OK' : r.json?.msg);
  if (!token) return;

  // pegar o barber id
  r = await api('/rest/v1/barbers?select=id&user_id=eq.e5afde60-77a8-4930-af02-278f142d1242', {}, token);
  console.log('barber:', r.status, JSON.stringify(r.json));
  const barberId = r.json?.[0]?.id;

  // appointments com embed profile
  r = await api(`/rest/v1/appointments?select=*,service:services(*),profile:profiles(*)&barber_id=eq.${barberId}`, {}, token);
  console.log('appointments barbeiro:', r.status, r.status === 200 ? JSON.stringify(r.json).slice(0, 400) : r.json?.message);

  // availability do proprio barbeiro (update check leve: select)
  r = await api('/rest/v1/barber_availability?select=*&barber_id=eq.1b4674af-076e-4575-96a0-7add89658faf', {}, token);
  console.log('availability barbeiro:', r.status, Array.isArray(r.json) ? r.json.length + ' dias' : r.json?.message);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
