import { BackupPanel } from "@/components/backup-panel";
import { ChangePasswordForm } from "@/components/change-password-form";
import { EventForm } from "@/components/event-form";
import { EventList } from "@/components/event-list";
import { getTimelineEvents } from "@/lib/timeline";

export default async function AdminPage() {
  const events = await getTimelineEvents();

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <section>
        <h2 className="mb-4 text-xl font-semibold text-stone-950">Neues Ereignis</h2>
        <div className="grid gap-5">
          <EventForm />
          <BackupPanel />
          <ChangePasswordForm />
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-stone-950">Alle Ereignisse</h2>
        <EventList events={events} />
      </section>
    </div>
  );
}
