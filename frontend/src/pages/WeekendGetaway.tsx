import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { googleFlightsUrl, skyscannerUrl } from "../utils/flightLinks";
import { Spinner } from "../components/ui/Spinner";
import type { Destination } from "../types";

async function loadDestinations(): Promise<{ short_trips: Destination[]; regional: Destination[]; long_haul: Destination[] }> {
  const res = await fetch("/destinations.json");
  if (!res.ok) throw new Error("Failed");
  const all: Destination[] = await res.json();
  return {
    short_trips: all.filter(d => d.category === "short_trip"),
    regional: all.filter(d => d.category === "regional"),
    long_haul: all.filter(d => d.category === "long_haul"),
  };
}

const EMOJI: Record<string, string> = {
  PEN:"🏖️", LGK:"🌴", DPS:"🌊",
  KUL:"🏙️", BKK:"🏯", HKT:"🏝️",
  SGN:"🛵", HAN:"🌸", DAD:"⛵", REP:"🏛️", HKG:"🌆", TPE:"🗼",
  NRT:"🗾", KIX:"⛩️", ICN:"🇰🇷",
};

function fmt(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("zh-SG", { month: "short", day: "numeric", weekday: "short" });
}

function DestChip({ dest, selected, onClick }: {
  dest: Destination; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
        selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
      }`}
    >
      <span>{EMOJI[dest.city_code] ?? "✈️"}</span>
      <span>{dest.city_name.split(" ")[0]}</span>
      <span className="text-xs opacity-70">{dest.flight_hours}h</span>
    </button>
  );
}

export function WeekendGetaway() {
  const [selectedDest, setSelectedDest] = useState("DPS");

  const { data: destinations, isLoading: destsLoading } = useQuery({
    queryKey: ["static-destinations"],
    queryFn: loadDestinations,
    staleTime: Infinity,
  });

  // Generate upcoming 8 Friday→Sunday windows entirely client-side
  const windows = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun,5=Fri
    const daysToFri = ((5 - dow + 7) % 7) || 7;
    const firstFri = new Date(today);
    firstFri.setDate(today.getDate() + daysToFri);

    return Array.from({ length: 8 }, (_, i) => {
      const fri = new Date(firstFri);
      fri.setDate(firstFri.getDate() + i * 7);
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      const outbound = fri.toISOString().slice(0, 10);
      const ret = sun.toISOString().slice(0, 10);
      return {
        outbound_date: outbound,
        return_date: ret,
        google_flights_url: googleFlightsUrl(selectedDest, outbound, ret),
        skyscanner_url: skyscannerUrl(selectedDest, outbound, ret),
      };
    });
  }, [selectedDest]);

  const selectedInfo = [
    ...(destinations?.short_trips ?? []),
    ...(destinations?.regional ?? []),
    ...(destinations?.long_haul ?? []),
  ].find(d => d.city_code === selectedDest);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <span className="font-semibold">✈️ 直飞 · 周五晚出发 → 周日返回</span>
        <span className="ml-2 text-blue-600">从 SIN 出发 · 2 晚周末出游</span>
      </div>

      {/* Destination picker */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        {destsLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">🏝️ 小岛短途</p>
              <div className="flex flex-wrap gap-2">
                {(destinations?.short_trips ?? []).map(d => (
                  <DestChip key={d.city_code} dest={d} selected={d.city_code === selectedDest}
                    onClick={() => setSelectedDest(d.city_code)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">🌏 东南亚 · 东北亚</p>
              <div className="flex flex-wrap gap-2">
                {(destinations?.regional ?? []).map(d => (
                  <DestChip key={d.city_code} dest={d} selected={d.city_code === selectedDest}
                    onClick={() => setSelectedDest(d.city_code)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">🗾 日韩远途</p>
              <div className="flex flex-wrap gap-2">
                {(destinations?.long_haul ?? []).map(d => (
                  <DestChip key={d.city_code} dest={d} selected={d.city_code === selectedDest}
                    onClick={() => setSelectedDest(d.city_code)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekend rows */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {selectedInfo
              ? `${EMOJI[selectedDest] ?? "✈️"} ${selectedInfo.city_name} · 接下来 8 个周末`
              : "接下来 8 个周末"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">直飞链接已预设，点击直接搜索</p>
        </div>

        {(
          <div className="divide-y divide-gray-50">
            {windows.map((w, i) => (
              <div key={w.outbound_date} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="w-6 text-xs text-gray-400 font-mono">W{i + 1}</span>
                <div className="flex-1 min-w-40 text-sm text-gray-800">
                  <span className="font-medium">{fmt(w.outbound_date)}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="font-medium">{fmt(w.return_date)}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={w.google_flights_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    🔍 Google Flights
                  </a>
                  <a
                    href={w.skyscanner_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                  >
                    ✈ Skyscanner
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
