import type { LeaveCategory } from "../../types";

const CATEGORY_LABELS: Record<LeaveCategory, string> = {
  no_leave: "不用请假",
  take_1_2: "请 1-2 天",
  take_3_5: "请 3-5 天",
};

const CATEGORY_COLORS: Record<LeaveCategory, string> = {
  no_leave: "bg-green-100 text-green-800",
  take_1_2: "bg-blue-100 text-blue-800",
  take_3_5: "bg-purple-100 text-purple-800",
};

export function LeaveBadge({ category }: { category: LeaveCategory }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function EfficiencyBadge({ efficiency }: { efficiency: number | null }) {
  if (efficiency === null) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">免费假期 ★</span>;
  }
  const stars = efficiency >= 4 ? "★★★" : efficiency >= 2.5 ? "★★" : "★";
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
      效率 {efficiency}× {stars}
    </span>
  );
}

export function PriceBadge({ price }: { price: number | null }) {
  if (price === null) return null;
  return (
    <span className="font-bold text-green-700">
      S${price.toFixed(0)}
    </span>
  );
}
