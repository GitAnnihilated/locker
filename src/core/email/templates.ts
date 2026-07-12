/**
 * Email HTML templates. Table-based layout with inline styles only — email
 * clients strip <style> blocks and modern CSS unpredictably, so this is the
 * one place in the app that deliberately doesn't use the Tailwind/CSS-vars
 * design system. Colors are hardcoded to match it anyway (#00573C pine,
 * #77CB34 lime, #FF9500 orange).
 *
 * The logo is a styled text lockup, not an image — this app has no hosted
 * asset storage yet. Swap the `logoBlock` for a hosted <img> once one exists;
 * nothing else in these templates needs to change.
 */

const PINE = "#00573C";
const INK = "#0F1F19";
const MUTED = "#5B6B63";
const BORDER = "#E3ECE7";
const BG = "#F4F8F6";

const logoBlock = `
  <tr>
    <td style="padding:32px 40px 8px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${PINE};width:32px;height:32px;border-radius:9px;text-align:center;vertical-align:middle;">
            <span style="font-size:16px;line-height:32px;">🔒</span>
          </td>
          <td style="padding-left:10px;font-size:18px;font-weight:700;color:${INK};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
            Locker
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const footerBlock = `
  <tr>
    <td style="padding:28px 40px 36px 40px;border-top:1px solid ${BORDER};">
      <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        This email was sent by Locker.
      </p>
    </td>
  </tr>
`;

function wrap(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
            ${logoBlock}
            ${bodyHtml}
            ${footerBlock}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function codeBlock(code: string): string {
  return `
    <tr>
      <td style="padding:8px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="background:${BG};border-radius:12px;padding:20px 0;text-align:center;">
              <span style="font-family:'SF Mono',Consolas,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:${PINE};">
                ${code}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

const textStyle = `font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK};font-size:15px;line-height:24px;`;
const mutedStyle = `font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${MUTED};font-size:13px;line-height:20px;`;

export function verificationEmailHtml({ name, code }: { name: string; code: string }): string {
  return wrap(`
    <tr>
      <td style="padding:20px 40px 4px 40px;">
        <p style="${textStyle}margin:0 0 16px 0;">Hello ${escapeHtml(name)},</p>
        <p style="${textStyle}margin:0 0 4px 0;">Welcome to Locker. Your verification code is:</p>
      </td>
    </tr>
    ${codeBlock(code)}
    <tr>
      <td style="padding:20px 40px 4px 40px;">
        <p style="${mutedStyle}margin:0 0 8px 0;">This code expires in 10 minutes.</p>
        <p style="${mutedStyle}margin:0;">If you didn't create this account, you can safely ignore this email.</p>
      </td>
    </tr>
  `);
}

export function passwordResetEmailHtml({ name, code }: { name: string; code: string }): string {
  return wrap(`
    <tr>
      <td style="padding:20px 40px 4px 40px;">
        <p style="${textStyle}margin:0 0 16px 0;">Hello ${escapeHtml(name)},</p>
        <p style="${textStyle}margin:0 0 4px 0;">We received a request to reset your Locker password. Your code is:</p>
      </td>
    </tr>
    ${codeBlock(code)}
    <tr>
      <td style="padding:20px 40px 4px 40px;">
        <p style="${mutedStyle}margin:0 0 8px 0;">This code expires in 10 minutes.</p>
        <p style="${mutedStyle}margin:0;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      </td>
    </tr>
  `);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
