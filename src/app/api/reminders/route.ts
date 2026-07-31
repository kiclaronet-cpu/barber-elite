import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailLayout, SITE_URL } from '@/lib/email/layout'
import { sendEmail } from '@/lib/email/send'
import { timingSafeEqual } from 'crypto'

const webpush = require('web-push')

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@barberelite.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const secret = new URL(request.url).searchParams.get('secret') || ''
  const expected = process.env.CRON_SECRET || ''
  const a = Buffer.from(secret)
  const b = Buffer.from(expected)
  const valid = a.length === b.length && b.length > 0 && timingSafeEqual(a, b)
  if (!valid) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const target = new Date(now.getTime() + 60 * 60 * 1000)

  const todayStr = now.toISOString().split('T')[0]
  const targetStr = target.toISOString().split('T')[0]

  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

  const targetTime = fmt(target)

  const dateFilter = todayStr === targetStr ? todayStr : null

  const query = supabase
    .from('appointments')
    .select(`
      id,
      date,
      time,
      status,
      service:services(name),
      barber:barbers(name),
      profile:profiles(id, name, email)
    `)
    .in('status', ['pending', 'confirmed'])
    .eq('reminder_sent', false)
    .gte('date', todayStr)
    .order('time', { ascending: true })

  if (dateFilter) {
    query.eq('date', dateFilter).eq('time', targetTime)
  }

  const { data: appointments } = await query

  let reminders = 0

  if (appointments) {
    const filtered = (appointments as any[]).filter((a) => {
      const apptDate = new Date(`${a.date}T${a.time}:00`)
      const diffMs = apptDate.getTime() - now.getTime()
      return diffMs > 30 * 60000 && diffMs <= 90 * 60000
    })

    for (const appt of filtered) {
      try {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', appt.profile?.id)

        const displayDate = appt.date.split('-').reverse().join('/')
        const title = 'Lembrete: seu corte é em 1 hora!'
        const body = `${appt.service?.name || 'Serviço'} com ${appt.barber?.name || 'barbeiro'} às ${appt.time.slice(0, 5)} — ${displayDate}`

        if (subs && subs.length > 0) {
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                JSON.stringify({
                  title,
                  body,
                  url: '/cliente/agendamentos',
                  tag: `appt-${appt.id}`,
                })
              )
            } catch (e: any) {
              if (e?.statusCode === 404 || e?.statusCode === 410) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
              }
            }
          }
        }

        if (appt.profile?.email) {
          const firstName = (appt.profile.name || '').split(' ')[0] || 'cliente'
          const html = emailLayout(
            'Seu corte é em 1 hora!',
            `
            <p>Olá <strong style="color:#c9a84c;">${firstName}</strong>,</p>
            <p>Passando para lembrar que seu agendamento na <strong>Barber Elite</strong> é <strong>em 1 hora</strong>.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#0a0a0a;border:1px solid #2d2d2d;border-radius:12px;">
              <tr><td style="padding:20px 24px;">
                <div style="text-align:center;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;margin-bottom:16px;">Detalhes do Agendamento</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#e0e0e0;">
                  <tr><td style="padding:8px 0;color:#8a8a8a;width:40%;">Serviço</td><td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${appt.service?.name || '—'}</td></tr>
                  <tr><td style="padding:8px 0;color:#8a8a8a;">Barbeiro</td><td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${appt.barber?.name || '—'}</td></tr>
                  <tr><td style="padding:8px 0;color:#8a8a8a;">Data</td><td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${displayDate}</td></tr>
                  <tr><td style="padding:8px 0;color:#8a8a8a;">Horário</td><td style="padding:8px 0;font-weight:bold;color:#c9a84c;">${appt.time.slice(0, 5)}</td></tr>
                </table>
              </td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr><td align="center">
                <a href="${SITE_URL}/cliente/agendamentos" style="display:inline-block;background-color:#c9a84c;color:#0a0a0a;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:1px;">VER MEUS AGENDAMENTOS</a>
              </td></tr>
            </table>
            <p>Chegue com alguns minutos de antecedência. Te esperamos!</p>
            <p style="margin-bottom:0;">Atenciosamente,<br><strong style="color:#c9a84c;">Equipe Barber Elite</strong></p>
            `
          )

          await sendEmail({
            to: appt.profile.email,
            subject: 'Lembrete: seu corte na Barber Elite é em 1 hora!',
            html,
          })
        }

        await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)
        reminders++
      } catch (e) {
        continue
      }
    }
  }

  return NextResponse.json({ ok: true, reminders })
}
