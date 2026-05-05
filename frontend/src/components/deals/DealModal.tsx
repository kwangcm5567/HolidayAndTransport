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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          <section>
            <h3 className="font-semibold text-gray-800 mb-3">机票 (往返, 从 SIN)</h3>
            {flightsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : flights?.offers.length ? (
              <div className="space-y-2">
                {flights.offers.slice(0, 6).map((f) => <FlightCard key={f.id} offer={f} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">暂无机票数据（请确认 Amadeus API Key 已配置）</p>
            )}
          </section>

          <section>
            <h3 className="font-semibold text-gray-800 mb-3">酒店</h3>
            {hotelsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : hotels?.offers.length ? (
              <div className="space-y-2">
                {hotels.offers.slice(0, 6).map((h) => <HotelCard key={h.offer_id} offer={h} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">暂无酒店数据（请确认 Amadeus API Key 已配置）</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
