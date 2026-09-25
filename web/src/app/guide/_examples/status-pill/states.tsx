import { StatusPill } from "@/components/ui";

const STATUSES = ["pending", "requested", "accepted", "approved", "rejected", "declined", "canceled"];

export default function StatusPillStates() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {STATUSES.map((s) => (
        <StatusPill key={s} status={s} />
      ))}
    </div>
  );
}
