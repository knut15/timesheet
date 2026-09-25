import { ErrorText, Field } from "@/components/ui";

export default function FieldWithError() {
  return (
    <div className="space-y-2">
      <Field label="초대 코드">
        <input className="field" defaultValue="DEMO-0000" />
      </Field>
      <ErrorText>초대 코드를 찾을 수 없어요.</ErrorText>
    </div>
  );
}
