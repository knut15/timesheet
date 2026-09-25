import { Field } from "@/components/ui";

export default function FieldDate() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="시작일">
        <input type="date" className="field" defaultValue="2026-09-28" />
      </Field>
      <Field label="종료일">
        <input type="date" className="field" defaultValue="2026-09-29" />
      </Field>
    </div>
  );
}
