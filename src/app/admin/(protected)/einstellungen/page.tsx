import { SettingsForm } from "@/components/settings-form";
import { getTimelineOwnerName } from "@/lib/settings";

export default function AdminSettingsPage() {
  const ownerName = getTimelineOwnerName();

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">App-Einstellungen</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Allgemeine Angaben für die öffentliche Timeline und die Darstellung der App.
        </p>
      </div>
      <SettingsForm ownerName={ownerName} />
    </div>
  );
}
