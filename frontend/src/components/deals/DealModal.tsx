import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import type { HolidayWindowSummary, DestinationDeal } from "../../types";
import { FlightCard } from "../flights/FlightCard";
import { HotelCard } from "../hotels/HotelCard";
import { Spinner } from "../ui/Spinner";

interface Props {
  window: HolidayWindowSummary;
  deal: DestinationDeal;
  onClose: () => void;
}

function ExternalSearchButtons({
  destination,
  outbound,
  returnDate,
}: {
  destination: string;
  outbound: string;
  returnDate: string;
}) {
  const { data: links } = useQuery({
    queryKey: ["flight-links", destination, outbound, returnDate],
    queryFn: () => api.getFlightLinks(destination, outbound, returnDate),
    staleTime: Infinity,
  });

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <a
        href={links?.google_flights ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <span>🔍</span> 在 Google Flights 搜索
      </a>
      <a
        href={links?.skyscanner ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <span>✈</span> 在 Skyscanner 搜索
      </a>
    </div>
  );
}

export function DealModal({ window: win, deal, onClose }: Props) {
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ["flights", deal.city_code, win.window_start, win.window_end],
    queryFn: () => api.searchFlights(deal.city_code, win.window_start, win.window_end),
    staleTime: 10 * 60 * 1000,
  });

  const { data: hotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ["hotels", deal.city_code, win.window_start, win.window_end],
    queryFn: () => api.searchHotels(deal.city_code, win.window_start, win.window_end),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {deal.city_name} · {deal.country}
            </h2>
            <p className="text-sm text-gray-500">
              {win.window_start} → {win.window_end} · {win.total_days_off} 天
              {win.leave_days_required > 0 && ` · 请 ${win.leave_days_required} 天年假`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          {/* Direct search links — always shown first */}
          <section>
            <p className="text-xs font-medium text-gray-500 mb-2">直接跳转搜索（实时价格）</p>
            <ExternalSearchButtons
              destination={deal.city_code}
              outbound={win.window_start}
              returnDate={win.window_end}
            />
          </section>

          {/* Scraped flights (best-effort) */}
          <section>
            <h3 className="font-semibold text-gray-800 mb-1">参考机票价格</h3>
            <p className="text-xs text-gray-400 mb-3">
              通过网页爬虫抓取，价格仅供参考，实际以航空公司/搜索引擎为准
            </p>
            {flightsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : flights?.offers && flights.offers.length > 0 ? (
              <div className="space-y-2">
                {flights.offers.slice(0, 6).map((f) => (
                  <FlightCard key={f.id} offer={f} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                爬虫暂时未能抓到价格（Google 可能拦截了请求）。<br />
                请点击上方按钮直接在 Google Flights / Skyscanner 查看真实价格。
              </div>
            )}
          </section>

          {/* Hotels */}
          <section>
            <h3 className="font-semibold text-gray-800 mb-3">酒店</h3>
            {hotelsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : hotels?.offers && hotels.offers.length > 0 ? (
              <div className="space-y-2">
                {hotels.offers.slice(0, 6).map((h) => (
                  <HotelCard key={h.offer_id} offer={h} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                暂无酒店数据（请确认 Amadeus API Key 已配置）
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
