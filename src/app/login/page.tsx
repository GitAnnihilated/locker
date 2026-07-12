import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { LogoMark } from "@/ui/brand/Logo";
import { CredentialsSignInForm } from "./_components/CredentialsSignInForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reset?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { verified, reset } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogoMark size={26} tone="mono" className="text-accent-fg" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Welcome to Locker</h1>
          <p className="mt-1 text-sm text-subtle">
            Sign in to join your class and see today&apos;s homework.
          </p>

          {verified && (
            <Badge tone="success" className="mt-4">
              Email verified — sign in to continue
            </Badge>
          )}
          {reset && (
            <Badge tone="success" className="mt-4">
              Password updated — sign in with your new password
            </Badge>
          )}

          <div className="mt-6">
            <CredentialsSignInForm />
          </div>

          <p className="mt-4 text-sm text-subtle">
            New here?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-4 text-xs text-subtle">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
