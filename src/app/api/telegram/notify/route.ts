import { NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8852013511:AAGJIJI0AvqCD74fccLUwPFONjmFk8TCMOE'
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

export async function POST(request: Request) {
  try {
    const { name, service, barber, date, time, price, duration, phone, status } = await request.json()

    if (!TELEGRAM_CHAT_ID) {
      return NextResponse.json({ error: 'Chat ID não configurado' }, { status: 500 })
    }

    let message = ''

    if (status === 'signup') {
      message = `
━━━━━━━━━━━━━━━━━━━━
🆕 *NOVO CLIENTE CADASTRADO — Barber Elite*

👤 *Nome:* ${name || '—'}
📞 *Telefone:* ${phone || '—'}
📧 *Acesso pelo site:* Sim
━━━━━━━━━━━━━━━━━━━━
      `.trim()
    } else {
      const statusEmoji =
        status === 'confirmed' ? '✅' : status === 'cancelled' ? '❌' : '🕐'

      const statusLabel =
        status === 'confirmed' ? 'CONFIRMADO' : status === 'cancelled' ? 'CANCELADO' : 'NOVO AGENDAMENTO'

      message = `
━━━━━━━━━━━━━━━━━━━━
✂️ *${statusLabel} — Barber Elite*

👤 *Cliente:* ${name || '—'}
📞 *Telefone:* ${phone || '—'}
💈 *Serviço:* ${service || '—'}
${duration ? `⏱ *Duração:* ${duration} min\n` : ''}👨 *Barbeiro:* ${barber || '—'}
📅 *Data:* ${date || '—'}
🕒 *Horário:* ${time || '—'}
${price ? `💰 *Valor:* ${price}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
      `.trim()
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    })

    const data = await res.json()
    if (!data.ok) {
      return NextResponse.json({ error: data.description || 'Erro Telegram' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
