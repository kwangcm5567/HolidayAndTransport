import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "../store/filterStore";
import type { HolidayWindowSummary } from "../types";
import { YearSelector } from "../components/filters/YearSelector";
import { Spinner } from "../components/ui/Spinner";
import { YearCalendar, type DateMap } from "../components/calendar/YearCalendar";
import { WindowPanel } from "../components/calendar/WindowPanel";

interface StaticData {
  year: number;
  total_holidays: number;
  windows: HolidayWindowSummary[];
  last_updated: string;
}

async function loadWindows(year: number): Promise<StaticData> {
  const res = await fetch(`/windows.json`);
  if (!res.ok) throw new Error("Failed to load");
  const all = await res.json();
  return all[String(year)];
}

export function CalendarPage() {
  const { year } = useFilterStore();
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["static-windows", year],
    queryFn: () => loadWindows(year),
    staleTime: Infinity,
  });

  const { dateMap, holidayMap } = useMemo(() => {
    const dateMap: DateMap = {};
    const holidayMap: Record<string, string> = {};
    if (!data) return { dateMap, holidayMap };

    for (const win of data.windows) {
      holidayMap[win.holiday_date] = win.holiday_name;
      const start = new Date(win.window_start + "T12:00:00");
      const end = new Date(win.window_end + "T12:00:00");
      const cur = new Date(start);
      while (cur <= end) {
        const s = cur.toISOString().slice(0, 10);
        if (!dateMap[s]) dateMap[s] = [];
        const dupe = dateMap[s].some(w => w.holiday_id === win.holiday_id && w.category === win.category);
        if (!dupe) dateMap[s].push(win);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return { dateMap, holidayMap };
  }, [data]);

  const selectedWindows = useMemo(
    () => data?.windows.filter(w => w.holiday_id === selectedHolidayId) ?? [],
    [data, selectedHolidayId]
  );

  useEffect(() => {
    if (selectedHolidayId !== null && panelRef.current) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }, [selectedHolidayId]);

  function handleDayClick(windows: HolidayWindowSummary[]) {
    const hid = windows[0].holiday_id;
    setSelectedHolidayId(prev => (prev === hid ? null : hid));
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <YearSelector />
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-200" /> 公假
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-200" /> 不用请假
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-200" /> 请 1-2 天
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-200" /> 请 3-5 天
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-3 text-sm">正在加载…</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          无法加载数据，请刷新重试。
        </div>
      )}

      {data && (
        <>
          <YearCalendar
            year={year}
            dateMap={dateMap}
            holidayMap={holidayMap}
            selectedHolidayId={selectedHolidayId}
            onDayClick={handleDayClick}
          />
          <div ref={panelRef}>
            {selectedWindows.length > 0 && (
              <WindowPanel
                windows={selectedWindows}
                onClose={() => setSelectedHolidayId(null)}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
