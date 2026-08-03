export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://barber-elite-five.vercel.app';

export function emailLayout(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#141414;border-radius:16px;border:1px solid #2d2d2d;overflow:hidden;">
          <tr>
            <td style="padding:36px 40px 20px;text-align:center;border-bottom:1px solid #2d2d2d;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:bold;letter-spacing:3px;color:#c9a84c;">BARBER&nbsp;ELITE</div>
              <div style="font-family:Georgia,serif;font-size:13px;color:#8a8a8a;letter-spacing:6px;margin-top:6px;text-transform:uppercase;">Barbearia Premium</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <div style="font-family:Georgia,serif;font-size:24px;color:#f5f0e8;margin-bottom:20px;text-align:center;">${title}</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#e0e0e0;">${body}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;border-top:1px solid #2d2d2d;">
              <div style="font-family:Arial,sans-serif;font-size:12px;color:#8a8a8a;">
                Barber Elite &mdash; Tradição e sofisticação em cada corte.<br>
                <a href="${SITE_URL}" style="color:#c9a84c;text-decoration:none;">${SITE_URL.replace('https://', '')}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
