import { Resend } from "resend";

// Never hardcode the key — set RESEND_API_KEY in your environment.
// See .env.example for where this goes locally and in Vercel.
export const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared testing domain works with zero setup but can only send to
// your own Resend account email. Replace with a verified sending domain
// address (e.g. "Locker <noreply@yourdomain.com>") before real users rely on
// this in production — see RESEND_FROM_EMAIL in .env.example.
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "Locker <onboarding@resend.dev>";
