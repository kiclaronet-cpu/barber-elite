import { NextResponse } from 'next/server'
import { emailLayout, EMAIL_FROM, SITE_URL } from '@/lib/email/layout'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]

    const html = emailLayout(
      `Bem-vindo, ${firstName}!`,
      `
      <p>Olá <strong style="color:#c9a84c;">${name}</strong>,</p>
      <p>É com grande prazer que recebemos você na <strong>Barber Elite</strong>. Sua conta foi criada com sucesso!</p>
      <p>Estamos prontos para oferecer a você uma experiência premium de cuidado pessoal, com profissionais experientes, ambiente sofisticado e atendimento impecável.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td align="center">
            <a href="${SITE_URL}/agendamento" style="display:inline-block;background-color:#c9a84c;color:#0a0a0a;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:1px;">AGENDAR MEU PRIMEIRO CORTE</a>
          </td>
        </tr>
      </table>
      <p>O que você pode fazer agora:</p>
      <ul style="margin:12px 0 0;padding-left:20px;">
        <li style="margin-bottom:8px;">Escolher entre nossos serviços exclusivos</li>
        <li style="margin-bottom:8px;">Selecionar seu barbeiro preferido</li>
        <li style="margin-bottom:8px;">Agendar no melhor dia e horário para você</li>
        <li>Receber confirmações por email</li>
      </ul>
      <p style="margin-top:28px;">Seja bem-vindo à experiência <strong style="color:#c9a84c;">Barber Elite</strong>.</p>
      <p style="margin-bottom:0;">Atenciosamente,<br><strong style="color:#c9a84c;">Equipe Barber Elite</strong></p>
      `
    )

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: `Bem-vindo à Barber Elite, ${firstName}!`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
