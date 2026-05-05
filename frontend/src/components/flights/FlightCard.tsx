import type { FlightOffer } from "../../types";

function formatTime(isoStr: string) {
  if (!isoStr) return "--:--";
  return new Date(isoStr).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function FlightCard({ offer }: { offer: FlightOffer }) {
  const out = offer.outbound_segments[0];
  const ret = offer.return_segments[0];

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">{offer.airline}</span>
        <span className="text-lg font-bold text-blue-700">S${offer.price_sgd.toFixed(0)}</span>
      </div>

      {out && (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{out.departure_iata} → {out.arrival_iata}</span>
            <span>{formatTime(out.departure_time)} – {formatTime(out.arrival_time)}</span>
          </div>
          {offer.total_duration_outbound && (
            <span className="text-xs text-gray-400">去程 {offer.total_duration_outbound}</span>
          )}
        </div>
      )}

      {ret && (
        <div className="text-sm text-gray-500 mt-1">
          <span>{ret.departure_iata} → {ret.arrival_iata} </span>
          <span>{formatTime(ret.departure_time)} – {formatTime(ret.arrival_time)}</span>
        </div>
      )}

      {offer.seats_available !== null && offer.seats_available <= 5 && (
        <p className="text-xs text-red-500 mt-1">仅剩 {offer.seats_available} 位</p>
      )}
    </div>
  );
}
