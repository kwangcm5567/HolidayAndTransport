import type { HotelOffer } from "../../types";

export function HotelCard({ offer }: { offer: HotelOffer }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{offer.hotel_name}</p>
          {offer.room_type && (
            <p className="text-xs text-gray-500 mt-0.5">{offer.room_type}</p>
          )}
          {offer.board_type && (
            <p className="text-xs text-gray-400">{offer.board_type}</p>
          )}
        </div>
        <div className="text-right ml-2">
          <p className="text-lg font-bold text-green-700">S${offer.price_total_sgd.toFixed(0)}</p>
          <p className="text-xs text-gray-500">S${offer.price_per_night_sgd.toFixed(0)}/晚</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {offer.check_in} – {offer.check_out}
      </p>
    </div>
  );
}
