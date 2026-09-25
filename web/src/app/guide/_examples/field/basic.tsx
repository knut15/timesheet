import { Field } from "@/components/ui";

export default function FieldBasic() {
  return (
    <Field label="닉네임">
      <input className="field" defaultValue="김하늘" />
    </Field>
  );
}
