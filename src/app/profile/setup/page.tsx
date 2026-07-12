import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody } from "@/ui/components/Card";
import { ProfileSetupForm } from "./_components/ProfileSetupForm";

/**
 * One-time gate between sign-in and the app. Lives outside the (app) route
 * group deliberately: (app)/layout.tsx redirects here whenever
 * profileCompletedAt is null, and this page must not redirect back to
 * itself, so it requires a session + DB user (requireDbUser), never a
 * complete profile (requireCompleteProfile).
 */
export default async function ProfileSetupPage() {
  await requireDbUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-6 py-12">
      <Card className="animate-scale-in w-full max-w-sm">
        <CardBody className="text-center">
          <div className="text-3xl">👋</div>
          <h1 className="mt-3 text-xl font-bold">One last step</h1>
          <p className="mt-1 text-sm text-subtle">
            Tell classmates who you really are. Some students sign in with a
            parent&apos;s or family Google account, so we never assume your
            name — you tell us.
          </p>

          <div className="mt-6">
            <ProfileSetupForm />
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
