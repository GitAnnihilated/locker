import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { Card, CardBody } from "@/ui/components/Card";
import { LogoMark } from "@/ui/brand/Logo";
import { buildMetadata } from "@/lib/seo";
import { SignUpForm } from "./_components/SignUpForm";

export const metadata: Metadata = buildMetadata({
  title: "Create your account",
  description: "Create a free Locker account — homework, groups, a school marketplace, and achievements for students and teachers.",
  path: "/signup",
});

export default async function SignUpPage() {
  // An already-authenticated visitor doesn't need the signup form.
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
