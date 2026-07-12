import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { SignUpForm } from "./_components/SignUpForm";

export default async function SignUpPage() {
  // Same reasoning as /login: an already-authenticated visitor should never
  // be able to re-enter the sign-in flow and trigger account linking.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <LogoMark size={26} tone="mono" className="text-accent-fg" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Create your Locker account</h1>
          <p className="mt-1 text-sm text-subtle">
            Use your real name — it&apos;s how classmates will recognize you.
          </p>

          <div className="mt-6">
            <SignUpForm />
          </div>

          <p className="mt-4 text-sm text-subtle">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
