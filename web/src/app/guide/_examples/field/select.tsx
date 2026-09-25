import { Field } from "@/components/ui";

export default function FieldSelect() {
  return (
    <Field label="대타 동료">
      <select className="field" defaultValue="user-demo-05">
        <option value="user-demo-05">이서준</option>
        <option value="user-demo-06">박도윤</option>
        <option value="user-demo-02">Mia</option>
      </select>
    </Field>
  );
}
