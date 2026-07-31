import { NextResponse } from 'next/server'
import { emailLayout, SITE_URL } from '@/lib/email/layout'
import { sendEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  try {
    const { email, name, service, barber, date, time, price, duration, status } = await request.json()

    if (!email || !name || !service || !barber || !date || !time) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]
    const statusLabel =
      status === 'confirmed' ? 'CONFIRMADO' : status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE DE CONFIRMAÇÃO'

    const statusColor = status === 'cancelled' ? '#ef4444' : status === 'confirmed' ? '#22c55e' : '#c9a84c'

    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const html = emailLayout(
      'Agendamento recebido!',
      `
      <p>Olá <strong style="color:#c9a84c;">${firstName}</strong>,</p>
      <p>Recebemos seu agendamento na <strong>Barber Elite</strong>. Confira os detalhes abaixo:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:#0a0a0a;border:1px solid #2d2d2d;border-radius:12px;">
        <tr>
          <td style="padding:20px 24px;">
            <div style="text-align:center;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;margin-bottom:16px;">Detalhes do Agendamento</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#e0e0e0;">
              <tr>
                <td style="padding:8px 0;color:#8a8a8a;width:40%;">Serviço</td>
                <td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${service}${duration ? ` (${duration} min)` : ''}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#8a8a8a;">Barbeiro</td>
                <td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${barber}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#8a8a8a;">Data</td>
                <td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#8a8a8a;">Horário</td>
                <td style="padding:8px 0;font-weight:bold;color:#f5f0e8;">${time}</td>
              </tr>
              ${price ? `
              <tr>
                <td style="padding:8px 0;color:#8a8a8a;">Valor</td>
                <td style="padding:8px 0;font-weight:bold;color:#c9a84c;">${price}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;color:${statusColor};border:2px solid ${statusColor};padding:8px 24px;border-radius:999px;">${statusLabel}</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/cliente/agendamentos" style="display:inline-block;background-color:#c9a84c;color:#0a0a0a;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:1px;">VER MEUS AGENDAMENTOS</a>
          </td>
        </tr>
      </table>
      <p>Chegue com alguns minutos de antecedência e desfrute da experiência premium que você merece.</p>
      <p style="margin-bottom:0;">Atenciosamente,<br><strong style="color:#c9a84c;">Equipe Barber Elite</strong></p>
      `
    )

    await sendEmail({
      to: email,
      subject: `Agendamento ${statusLabel} — ${service} • ${time}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
