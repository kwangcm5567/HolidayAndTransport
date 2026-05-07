import type { HolidayWindowSummary } from "../../types";

const MONTHS_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const WEEKDAYS = ["一","二","三","四","五","六","日"];

export type DateMap = Record<string, HolidayWindowSummary[]>;

const CAT_BG: Record<string, string> = {
  no_leave: "bg-green-100 hover:bg-green-200 text-green-900",
  take_1_2: "bg-amber-100 hover:bg-amber-200 text-amber-900",
  take_3_5: "bg-orange-100 hover:bg-orange-200 text-orange-900",
};

function bestCategory(windows: HolidayWindowSummary[]): string | null {
  if (windows.some(w => w.category === "no_leave")) return "no_leave";
  if (windows.some(w => w.category === "take_1_2")) return "take_1_2";
  if (windows.some(w => w.category === "take_3_5")) return "take_3_5";
  return null;
}

function MonthGrid({ year, month, dateMap, holidayMap, selectedHolidayId, onDayClick }: {
  year: number;
  month: number;
  dateMap: DateMap;
  holidayMap: Record<string, string>;
  selectedHolidayId: number | null;
  onDayClick: (windows: HolidayWindowSummary[]) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
      <p className="text-sm font-semibold text-gray-700 text-center mb-2">{MONTHS_ZH[month]}</p>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;

          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const dateStr = `${year}-${mm}-${dd}`;
          const windows = dateMap[dateStr] ?? [];
          const isHoliday = !!holidayMap[dateStr];
          const cat = bestCategory(windows);
          const isSelected = selectedHolidayId !== null &&
            windows.some(w => w.holiday_id === selectedHolidayId);
          const isToday = dateStr === todayStr;
          const dow = new Date(dateStr + "T12:00:00").getDay();
          const isWeekend = dow === 0 || dow === 6;

          let cls = "relative text-center text-xs py-1 rounded-md transition-colors select-none ";
          if (isSelected) {
            cls += "bg-blue-500 text-white ring-2 ring-blue-400 ";
          } else if (isHoliday) {
            cls += "bg-red-100 text-red-800 font-bold ";
          } else if (cat) {
            cls += CAT_BG[cat] + " ";
          } else if (isWeekend) {
            cls += "text-gray-500 ";
          }

          if (windows.length > 0) cls += "cursor-pointer ";
          if (isToday) cls += "ring-2 ring-blue-500 font-bold ";

          return (
            <button
              key={dateStr}
              onClick={() => windows.length > 0 && onDayClick(windows)}
              className={cls}
              title={holidayMap[dateStr]}
            >
              {day}
              {isHoliday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 block w-1 h-1 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  year: number;
  dateMap: DateMap;
  holidayMap: Record<string, string>;
  selectedHolidayId: number | null;
  onDayClick: (windows: HolidayWindowSummary[]) => void;
}

export function YearCalendar({ year, dateMap, holidayMap, selectedHolidayId, onDayClick }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 12 }, (_, m) => (
        <MonthGrid
          key={m}
          year={year}
          month={m}
          dateMap={dateMap}
          holidayMap={holidayMap}
          selectedHolidayId={selectedHolidayId}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
