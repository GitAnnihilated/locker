import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { email } = await searchParams;
  if (!email) redirect("/forgot-password");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogoMark size={26} tone="mono" className="text-accent-fg" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Enter your code</h1>
          <p className="mt-1 text-sm text-subtle">
            If an account exists for <span className="font-medium text-text">{email}</span>, we
            sent it a 6-digit code.
          </p>

          <div className="mt-6">
            <ResetPasswordForm email={email} />
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
