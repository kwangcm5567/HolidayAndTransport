export type LeaveCategory = "no_leave" | "take_1_2" | "take_3_5";

export interface Holiday {
  id: number;
  date: string;
  day_of_week: string;
  name: string;
  year: number;
  is_observed: boolean;
}

export interface TravelWindow {
  id: number;
  holiday_id: number;
  holiday_name: string;
  holiday_date: string;
  holiday_day_of_week: string;
  leave_days_required: number;
  window_start: string;
  window_end: string;
  total_days_off: number;
  efficiency: number | null;
  leave_dates: string[];
  category: LeaveCategory;
}

export interface FlightSegment {
  departure_iata: string;
  arrival_iata: string;
  departure_time: string;
  arrival_time: string;
  carrier_code: string;
  flight_number: string;
  duration: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  price_sgd: number;
  currency: string;
  seats_available: number | null;
  outbound_segments: FlightSegment[];
  return_segments: FlightSegment[];
  total_duration_outbound: string | null;
  booking_class: string | null;
}

export interface FlightSearchResponse {
  origin: string;
  destination: string;
  outbound_date: string;
  return_date: string;
  offers: FlightOffer[];
  cached: boolean;
  searched_at: string;
}

export interface HotelOffer {
  offer_id: string;
  hotel_id: string;
  hotel_name: string;
  city_code: string;
  check_in: string;
  check_out: string;
  price_total_sgd: number;
  price_per_night_sgd: number;
  room_type: string | null;
  board_type: string | null;
  currency: string;
}

export interface HotelSearchResponse {
  city_code: string;
  check_in: string;
  check_out: string;
  nights: number;
  offers: HotelOffer[];
  cached: boolean;
  searched_at: string;
}

export interface Destination {
  city_code: string;
  city_name: string;
  country: string;
  amadeus_city_code: string;
  flight_hours: number;
  category: string;
  popular_rank: number;
}

export interface DestinationDeal {
  city_code: string;
  city_name: string;
  country: string;
  cheapest_flight_sgd: number | null;
  cheapest_hotel_total_sgd: number | null;
  total_estimated_sgd: number | null;
  nights: number;
  flight_hours: number | null;
}

export interface HolidayWindowSummary {
  holiday_id: number;
  holiday_name: string;
  holiday_date: string;
  holiday_day_of_week: string;
  leave_window_id: number;
  leave_days_required: number;
  category: LeaveCategory;
  window_start: string;
  window_end: string;
  total_days_off: number;
  efficiency: number | null;
  leave_dates: string[];
  deals: DestinationDeal[];
}

export interface DashboardResponse {
  year: number;
  total_holidays: number;
  windows: HolidayWindowSummary[];
  last_updated: string;
}

export interface SearchRequest {
  origin: string;
  destination: string;
  outbound_date: string;
  return_date: string;
  adults: number;
}
