const fs = require('fs');
const path = require('path');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const OUT = path.join(__dirname, '..', 'BACKUP', 'database');
fs.mkdirSync(OUT, { recursive: true });

async function api(u, opts = {}) {
  const res = await fetch(url + u, {
    ...opts,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  return json;
}

async function main() {
  // 1. OpenAPI spec (tables/columns/FKs) - already saved by PowerShell, re-save for completeness
  const spec = await api('/rest/v1/', { headers: { Accept: 'application/openapi+json' } });
  fs.writeFileSync(path.join(OUT, 'openapi-schema.json'), JSON.stringify(spec, null, 2));

  const defs = spec.definitions || {};
  const tableNames = Object.keys(defs).filter(d => d !== 'User' && d !== 'Identity');

  // 2. Data dump per table (respecting max_rows=1000, orders by pk-less list fine)
  const dump = {};
  for (const t of tableNames) {
    try {
      const { data, error } = { data: await api(`/rest/v1/${t}?select=*`), error: null };
      dump[t] = data;
      console.log(`DATA ${t}: ${data.length}`);
    } catch (e) {
      dump[t] = { error: e.message };
      console.log(`DATA ${t}: ERROR ${e.message}`);
    }
  }
  fs.writeFileSync(path.join(OUT, 'data_dump.json'), JSON.stringify(dump, null, 2));

  // 3. Storage buckets + objects
  const buckets = await api('/storage/v1/bucket');
  fs.writeFileSync(path.join(OUT, 'storage_buckets.json'), JSON.stringify(buckets, null, 2));
  for (const b of buckets) {
    let objects = [];
    let offset = 0;
    for (;;) {
      const page = await api(`/storage/v1/object/list/${b.id}?limit=1000&offset=${offset}&sortBy={"column":"name","order":"asc"}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: '' }) });
      objects = objects.concat(page);
      if (page.length < 1000) break;
      offset += page.length;
    }
    fs.writeFileSync(path.join(OUT, `storage_objects_${b.id}.json`), JSON.stringify(objects, null, 2));
    console.log(`BUCKET ${b.id}: ${objects.length} objects`);
  }

  // 4. Auth users (GoTrue admin)
  let users = [];
  let page = 1;
  for (;;) {
    const r = await api(`/auth/v1/admin/users?per_page=200&page=${page}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    users = users.concat(r.users || []);
    if ((r.users || []).length < 200) break;
    page++;
  }
  fs.writeFileSync(path.join(OUT, 'auth_users.json'), JSON.stringify(users, null, 2));
  console.log(`AUTH USERS: ${users.length}`);

  console.log('DONE');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
