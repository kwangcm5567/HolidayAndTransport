import type { LeaveCategory } from "../../types";
import { useFilterStore } from "../../store/filterStore";

type Option = { value: LeaveCategory | "all"; label: string; desc: string };

const OPTIONS: Option[] = [
  { value: "all",      label: "全部假期",   desc: "显示所有出行窗口" },
  { value: "no_leave", label: "不用请假",   desc: "公假 + 周末，零年假" },
  { value: "take_1_2", label: "请 1-2 天",  desc: "最多请 2 天年假" },
  { value: "take_3_5", label: "请 3-5 天",  desc: "最多请 5 天年假" },
];

export function LeaveTypeFilter() {
  const { category, setCategory } = useFilterStore();

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">年假筛选</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategory(opt.value)}
            title={opt.desc}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
