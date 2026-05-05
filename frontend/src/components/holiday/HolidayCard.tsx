import { useState } from "react";
import type { HolidayWindowSummary, DestinationDeal } from "../../types";
import { LeaveBadge, EfficiencyBadge } from "../ui/Badge";
import { DealModal } from "../deals/DealModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-SG", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function DealChip({ deal, onClick }: { deal: DestinationDeal; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start border border-gray-200 rounded-lg p-2 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left min-w-[90px]"
    >
      <span className="text-xs font-semibold text-gray-800 leading-tight">{deal.city_name.split(" ")[0]}</span>
      <span className="text-xs text-gray-500">{deal.country}</span>
      <span className="text-xs text-blue-500 mt-1">{deal.flight_hours}h ✈</span>
      {deal.total_estimated_sgd && (
        <span className="text-xs font-bold text-green-700 mt-0.5">S${deal.total_estimated_sgd.toFixed(0)}</span>
      )}
    </button>
  );
}

export function HolidayCard({ window: win }: { window: HolidayWindowSummary }) {
  const [selectedDeal, setSelectedDeal] = useState<DestinationDeal | null>(null);

  const totalDays = (
    (new Date(win.window_end).getTime() - new Date(win.window_start).getTime()) /
    86400000
  ) + 1;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{win.holiday_name}</h3>
            <p className="text-sm text-gray-500">
              {win.holiday_day_of_week}, {formatDate(win.holiday_date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <LeaveBadge category={win.category} />
            <EfficiencyBadge efficiency={win.efficiency} />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>{formatDate(win.window_start)} – {formatDate(win.window_end)}</span>
            <span className="font-semibold text-blue-700">{totalDays} 天连假</span>
          </div>
          {win.leave_dates.length > 0 && (
            <p className="text-xs text-orange-600 mt-1">
              请假日期: {win.leave_dates.map((d) => formatDate(d)).join("、")}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">点击查看机票和酒店</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {win.deals.slice(0, 8).map((deal) => (
              <DealChip key={deal.city_code} deal={deal} onClick={() => setSelectedDeal(deal)} />
            ))}
          </div>
        </div>
      </div>

      {selectedDeal && (
        <DealModal window={win} deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </>
  );
}
