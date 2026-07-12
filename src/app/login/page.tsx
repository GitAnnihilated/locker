import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/core/auth/auth";
import { Button } from "@/ui/components/Button";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { CredentialsSignInForm } from "./_components/CredentialsSignInForm";

export default async function LoginPage() {
  // If you're already signed in and click "Continue with Google" again
  // (e.g. testing a second account), Auth.js tries to link the new Google
  // account to your CURRENT session's user instead of switching accounts —
  // and if that email already belongs to a different existing user, that
  // collision is exactly what throws OAuthAccountNotLinked. Bouncing an
  // already-authenticated visitor away from /login removes that path
  // entirely; signing in as someone else now requires logging out first.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

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

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Continue with Google
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-subtle">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <CredentialsSignInForm />

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
