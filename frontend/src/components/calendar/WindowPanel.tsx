import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import type { HolidayWindowSummary, DestinationDeal } from "../../types";
import { googleFlightsUrl, skyscannerUrl } from "../../utils/flightLinks";

const CAT_INFO: Record<string, { label: string; cls: string }> = {
  no_leave: { label: "不用请假", cls: "bg-green-100 text-green-800 border-green-300" },
  take_1_2: { label: "请 1-2 天", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  take_3_5: { label: "请 3-5 天", cls: "bg-orange-100 text-orange-800 border-orange-300" },
};

const EMOJI: Record<string, string> = {
  PEN:"🏖️", LGK:"🌴", DPS:"🌊",
  KUL:"🏙️", BKK:"🏯", HKT:"🏝️",
  SGN:"🛵", HAN:"🌸", DAD:"⛵", REP:"🏛️", HKG:"🌆", TPE:"🗼",
  NRT:"🗾", KIX:"⛩️", ICN:"🇰🇷",
};

function fmt(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("zh-SG", {
    month: "short", day: "numeric", weekday: "short",
  });
}

function DestChip({ deal, win }: { deal: DestinationDeal; win: HolidayWindowSummary }) {
  const [open, setOpen] = useState(false);
  const gUrl = googleFlightsUrl(deal.city_code, win.window_start, win.window_end);
  const sUrl = skyscannerUrl(deal.city_code, win.window_start, win.window_end);
  const name = deal.city_name.split(" ")[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
          open
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <span>{EMOJI[deal.city_code] ?? "✈️"}</span>
        <span className="font-medium">{name}</span>
        <span className="text-xs opacity-70">{deal.flight_hours}h</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex flex-col gap-1.5 min-w-max">
          <a
            href={gUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            🔍 Google Flights
          </a>
          <a
            href={sUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
          >
            ✈ Skyscanner
          </a>
        </div>
      )}
    </div>
  );
}

interface Props {
  windows: HolidayWindowSummary[];
  onClose: () => void;
}

export function WindowPanel({ windows, onClose }: Props) {
  const orderedCats = (["no_leave", "take_1_2", "take_3_5"] as const).filter(
    cat => windows.some(w => w.category === cat)
  );
  const [selectedCat, setSelectedCat] = useState<string>(orderedCats[0]);
  const win = windows.find(w => w.category === selectedCat) ?? windows[0];

  const { data: destinations } = useQuery({
    queryKey: ["destinations"],
    queryFn: api.getDestinations,
    staleTime: Infinity,
  });

  const catByCode: Record<string, string> = {};
  if (destinations) {
    [...destinations.short_trips, ...destinations.regional, ...destinations.long_haul]
      .forEach(d => { catByCode[d.city_code] = d.category; });
  }

  const shortDeals = win.deals.filter(d => catByCode[d.city_code] === "short_trip");
  const regionalDeals = win.deals.filter(d => catByCode[d.city_code] === "regional");
  const longDeals = win.deals.filter(d => catByCode[d.city_code] === "long_haul");

  return (
    <div className="mt-4 bg-white rounded-xl border border-blue-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900 text-base">{win.holiday_name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {win.holiday_date} ({win.holiday_day_of_week}) · 点击目的地查看机票
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none mt-0.5">×</button>
      </div>

      {/* Leave tabs */}
      <div className="flex gap-2 px-4 pt-3 flex-wrap">
        {orderedCats.map(cat => {
          const info = CAT_INFO[cat];
          const w = windows.find(x => x.category === cat)!;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCat === cat ? info.cls : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {info.label} · {w.total_days_off}天
              {w.efficiency && w.leave_days_required > 0 && (
                <span className="ml-1 opacity-70">({w.efficiency}x)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Window detail */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-800">
            {fmt(win.window_start)} → {fmt(win.window_end)}
          </span>
          <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-medium">
            共 {win.total_days_off} 天假期
          </span>
          {win.leave_dates.length > 0 && (
            <span className="text-xs text-gray-500">
              请假日：{win.leave_dates.map(d => fmt(d)).join("、")}
            </span>
          )}
        </div>
      </div>

      {/* Destinations */}
      <div className="px-4 py-3 space-y-3">
        {shortDeals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">🏝️ 小岛短途</p>
            <div className="flex flex-wrap gap-2">
              {shortDeals.map(d => <DestChip key={d.city_code} deal={d} win={win} />)}
            </div>
          </div>
        )}
        {regionalDeals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">🌏 东南亚 · 东北亚</p>
            <div className="flex flex-wrap gap-2">
              {regionalDeals.map(d => <DestChip key={d.city_code} deal={d} win={win} />)}
            </div>
          </div>
        )}
        {longDeals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">🗾 日韩远途</p>
            <div className="flex flex-wrap gap-2">
              {longDeals.map(d => <DestChip key={d.city_code} deal={d} win={win} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
