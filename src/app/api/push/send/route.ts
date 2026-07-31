import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const webpush = require('web-push')

export const runtime = 'nodejs'

async function isAdmin(supabase: any, request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!(await isAdmin(supabase, request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  const { data: users } = await supabase
    .from('push_subscriptions')
    .select('user_id, created_at, profile:profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    ok: true,
    total: count || 0,
    recent: users || [],
  })
}

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!(await isAdmin(supabase, request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { title, body, url } = await request.json()

  if (!title || !body) {
    return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@barberelite.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const { data: subs } = await supabase.from('push_subscriptions').select('*')

  let sent = 0
  let failed = 0
  let removed = 0

  if (subs && subs.length > 0) {
    const payload = JSON.stringify({
      title,
      body,
      url: url && url.startsWith('/') ? url : '/cliente',
      tag: `admin-${Date.now()}`,
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
        sent++
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          removed++
        } else {
          failed++
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    removed,
    total: subs?.length || 0,
  })
}
