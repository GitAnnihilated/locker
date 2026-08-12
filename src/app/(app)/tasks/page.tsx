import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { getMyTasks } from "@/modules/tasks/queries";
import { CreateTaskForm } from "@/modules/tasks/components/CreateTaskForm";
import { TaskRow } from "@/modules/tasks/components/TaskRow";

export default async function TasksPage() {
  const user = await requireDbUser();
  const { open, done } = await getMyTasks(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My tasks</h1>
        <p className="mt-1 text-sm text-subtle">
          The ad hoc things people ask you to do — not an official duty list, just yours.
        </p>
      </div>

      <Card>
        <CardBody>
          <CreateTaskForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Open ({open.length})</CardHeader>
        <CardBody className="p-0">
          {open.length === 0 ? (
            <p className="p-4 text-sm text-subtle">Nothing on your list — add one above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {open.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {done.length > 0 && (
        <Card>
          <CardHeader className="font-semibold">Done</CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
