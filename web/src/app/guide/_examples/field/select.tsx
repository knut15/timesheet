import { Field } from "@/components/ui";

// 대타 요청처럼 날짜와 선택을 두 칸에 나란히 — 두 칸 높이가 같고(44px) 좁은 화면에서도 겹치지 않는다
export default function FieldSelect() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="날짜">
        <input type="date" className="field" defaultValue="2026-09-28" />
      </Field>
      <Field label="대타 동료">
        <select className="field" defaultValue="user-demo-05">
          <option value="user-demo-05">이서준</option>
          <option value="user-demo-06">박도윤</option>
          <option value="user-demo-02">Mia</option>
        </select>
      </Field>
    </div>
  );
}
