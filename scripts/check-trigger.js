const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

(async () => {
  const q = `
    select t.tgname as trigger_name, p.proname as function_name,
           pg_get_functiondef(p.oid) as function_def
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
    order by t.tgname
  `;
  const { data, error } = await sb.rpc('exec_sql', { q });
  console.log(JSON.stringify(data || error, null, 1));
})();
