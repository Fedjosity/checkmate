export const emailVerificationTemplate = (firstName: string, code: string): string => {
  const digits = code.split('');
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#ffffff;background-color:#1A1F2E;border:2px solid #C9A84C;border-radius:8px;letter-spacing:0.05em;">${d}</td>`
    )
    .join('<td style="width:8px;"></td>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email — CheckMate</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0B0F;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0F;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#0D1017;border:1px solid #1A1F2E;border-radius:8px;">
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1A1F2E;">
              <span style="font-size:32px;color:#C9A84C;">♔</span>
              <span style="font-size:24px;font-weight:700;color:#C9A84C;letter-spacing:0.05em;vertical-align:middle;margin-left:8px;">CheckMate</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0 0 12px;font-weight:700;">Verify your email, ${firstName}.</h1>
              <p style="color:#9CA3AF;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Enter the code below in the app to verify your account and start competing.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  ${digitBoxes}
                </tr>
              </table>
              <p style="color:#6B7280;font-size:13px;margin:0 0 8px;">
                This code expires in <strong style="color:#C9A84C;">10 minutes</strong>.
              </p>
              <p style="color:#6B7280;font-size:13px;margin:0;">
                If you didn't create a CheckMate account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1A1F2E;text-align:center;">
              <p style="color:#6B7280;font-size:12px;margin:0 0 8px;">CheckMate &middot; Competitive Chess, Real Rewards</p>
              <p style="color:#4B5563;font-size:11px;margin:0;">You're receiving this because you signed up for CheckMate.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
