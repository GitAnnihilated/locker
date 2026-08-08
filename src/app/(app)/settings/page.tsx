import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EducationTypeSettingsForm } from "@/modules/settings/components/EducationTypeSettingsForm";

export default async function SettingsPage() {
  const user = await requireDbUser();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader className="font-semibold">Education Type</CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-subtle">
            Controls your navigation, dashboard, and terminology — pick whichever matches where you
            actually study. You can change this anytime.
          </p>
          <EducationTypeSettingsForm current={user.educationType} />
        </CardBody>
      </Card>
    </div>
  );
}
