import { resend, EMAIL_FROM } from "./resend";
import { verificationEmailHtml, passwordResetEmailHtml } from "./templates";

// The Resend SDK does NOT throw on a failed send — a bad API key, an
// unverified sending domain, etc. all come back as `{ data: null, error }`,
// not a rejected promise. Silently ignoring that would mean the app treats
// "email failed to send" as success (PendingRegistration created, user
// redirected to "check your email" — and nothing ever arrives). Every call
// site here throws explicitly so that failure actually surfaces.

export async function sendVerificationEmail(to: string, name: string, code: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your Locker account",
    html: verificationEmailHtml({ name, code }),
  });
  if (error) {
    throw new Error(`Couldn't send the verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Reset your Locker password",
    html: passwordResetEmailHtml({ name, code }),
  });
  if (error) {
    throw new Error(`Couldn't send the reset email: ${error.message}`);
  }
}
