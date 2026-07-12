import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { VerifyEmailForm } from "./_components/VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { email } = await searchParams;
  if (!email) redirect("/signup");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogoMark size={26} tone="mono" className="text-accent-fg" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Check your email</h1>
          <p className="mt-1 text-sm text-subtle">
            We sent a 6-digit code to <span className="font-medium text-text">{email}</span>.
          </p>

          <div className="mt-6">
            <VerifyEmailForm email={email} />
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
