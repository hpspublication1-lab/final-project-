export interface EnrollmentEmailProps {
  studentName: string;
  planName: string;
  expirationDate?: string;
  loginUrl?: string;
}

export function generateEnrollmentEmailHtml({
  studentName,
  planName,
  expirationDate,
  loginUrl = 'https://samyakcee.com/sign-up-login-screen',
}: EnrollmentEmailProps): string {
  const expiryText = expirationDate
    ? new Date(expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '1 Year';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Enrollment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); text-align: center;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Samyak CEE Mastery</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #e0e7ff; opacity: 0.9;">Official Class Enrollment Confirmation</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff; font-weight: 700;">Welcome, ${studentName}! 🎉</h2>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          We are thrilled to confirm that your enrollment for **${planName}** classes is official and active.
        </p>

        <!-- Details Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px;">Enrolled Course / Plan</span>
              <div style="font-size: 16px; font-weight: 700; color: #38bdf8; margin-top: 2px;">${planName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px;">Enrollment Status</span>
              <div style="font-size: 15px; font-weight: 600; color: #4ade80; margin-top: 2px;">✓ Active & Confirmed</div>
            </td>
          </tr>
          <tr>
            <td>
              <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px;">Access Expiration</span>
              <div style="font-size: 15px; font-weight: 500; color: #f1f5f9; margin-top: 2px;">${expiryText}</div>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
            Go to Student Dashboard →
          </a>
        </div>

        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #94a3b8;">
          If you have any questions or need help accessing your live classes or practice modules, reach out to our team at any time.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          © ${new Date().getFullYear()} Samyak CEE Mastery. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
