import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

// Utility step in the auth flow, not a page anyone should land on from
// search — kept out of the index (see robots.ts too).
export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogoMark size={26} tone="mono" className="text-accent-fg" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Reset your password</h1>
          <p className="mt-1 text-sm text-subtle">
            Enter your email and we&apos;ll send you a 6-digit code.
          </p>

          <div className="mt-6">
            <ForgotPasswordForm />
          </div>

          <p className="mt-4 text-sm text-subtle">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
