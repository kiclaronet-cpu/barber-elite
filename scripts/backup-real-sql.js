const fs = require('fs');
const path = require('path');
const tok = process.env.SUPABASE_MGMT_TOKEN || '';
if (!tok) {
  console.error('Defina SUPABASE_MGMT_TOKEN (token de gerenciamento sbp_ do Supabase).');
  process.exit(1);
}
const ref = 'vhdwhjjgwbbiapgliliu';
const URL = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const OUT = path.join(__dirname, '..', 'BACKUP', 'database');
fs.mkdirSync(OUT, { recursive: true });

async function q(sql) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 800)}`);
  return json;
}

async function save(name, sql) {
  const data = await q(sql);
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2));
  const n = Array.isArray(data) ? data.length : '?';
  console.log(`${name}: ${n}`);
  return data;
}

(async () => {
  await save('real_01_tables.json', `select table_name from information_schema.tables where table_schema='public' order by table_name;`);
  await save('real_02_columns.json', `select table_name, column_name, data_type, is_nullable, column_default, character_maximum_length from information_schema.columns where table_schema='public' order by table_name, ordinal_position;`);
  await save('real_03_constraints.json', `
    select tc.table_name, tc.constraint_name, tc.constraint_type,
           kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_column,
           rc.delete_rule, rc.update_rule, chk.check_clause
    from information_schema.table_constraints tc
    left join information_schema.key_column_usage kcu on kcu.constraint_name=tc.constraint_name and kcu.table_schema=tc.table_schema
    left join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema
    left join information_schema.referential_constraints rc on rc.constraint_name=tc.constraint_name and rc.constraint_schema=tc.table_schema
    left join information_schema.check_constraints chk on chk.constraint_name=tc.constraint_name and chk.constraint_schema=tc.table_schema
    where tc.table_schema='public' order by tc.table_name, tc.constraint_name;`);
  await save('real_04_indexes.json', `select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by tablename, indexname;`);
  await save('real_05_sequences.json', `select schemaname, sequencename, data_type, start_value, min_value, max_value, increment_by, last_value from pg_sequences order by sequencename;`);
  await save('real_06_triggers.json', `
    select t.tgname as trigger_name, t.tgrelid::regclass::text as table_name,
           pg_get_triggerdef(t.oid) as trigger_def
    from pg_trigger t
    where not t.tgisinternal
    order by t.tgname;`);
  await save('real_07_functions.json', `
    select p.proname as function_name, pg_get_functiondef(p.oid) as function_def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by p.proname;`);
  await save('real_08_policies.json', `
    select c.relname as table_name, p.polname as policy_name,
           case p.polcmd when '*' then 'ALL' when 'r' then 'SELECT' when 'a' then 'INSERT'
                when 'w' then 'UPDATE' when 'd' then 'DELETE' end as command,
           pg_get_expr(p.polqual, p.polrelid) as using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid) as check_expr,
           array(select rolname from pg_roles where oid = any(p.polroles)) as roles
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    order by c.relname, p.polname;`);
  await save('real_09_storage_policies.json', `
    select c.relname as table_name, p.polname as policy_name,
           case p.polcmd when '*' then 'ALL' when 'r' then 'SELECT' when 'a' then 'INSERT'
                when 'w' then 'UPDATE' when 'd' then 'DELETE' end as command,
           pg_get_expr(p.polqual, p.polrelid) as using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    where c.relname = 'objects'
    order by p.polname;`);
  await save('real_10_storage_buckets.json', `select id, name, public, file_size_limit, allowed_mime_types, created_at from storage.buckets order by id;`);
  await save('real_11_grants.json', `
    select grantee, table_name, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public'
    order by grantee, table_name, privilege_type;`);
  console.log('DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
