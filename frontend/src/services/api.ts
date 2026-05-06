import axios from "axios";
import type {
  Holiday,
  TravelWindow,
  DashboardResponse,
  FlightSearchResponse,
  HotelSearchResponse,
  Destination,
  LeaveCategory,
  WeekendWindow,
} from "../types";

export const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const client = axios.create({ baseURL: BASE_URL });

export const api = {
  getHolidays: (year: number) =>
    client.get<Holiday[]>(`/holidays/${year}`).then((r) => r.data),

  getWindows: (year: number, category?: LeaveCategory | "all") =>
    client
      .get<TravelWindow[]>("/windows", { params: { year, category } })
      .then((r) => r.data),

  getDashboard: (year: number, category?: LeaveCategory | "all") =>
    client
      .get<DashboardResponse>("/dashboard", { params: { year, category } })
      .then((r) => r.data),

  searchFlights: (
    destination: string,
    outbound_date: string,
    return_date: string,
    adults = 1
  ) =>
    client
      .get<FlightSearchResponse>("/search/flights", {
        params: { destination, outbound_date, return_date, adults },
      })
      .then((r) => r.data),

  getFlightLinks: (destination: string, outbound_date: string, return_date: string) =>
    client
      .get<{ google_flights: string; skyscanner: string }>("/search/flight-links", {
        params: { destination, outbound_date, return_date },
      })
      .then((r) => r.data),

  searchHotels: (city_code: string, check_in: string, check_out: string, adults = 2) =>
    client
      .get<HotelSearchResponse>("/search/hotels", {
        params: { city_code, check_in, check_out, adults },
      })
      .then((r) => r.data),

  getDestinations: () =>
    client
      .get<{ short_trips: Destination[]; regional: Destination[]; long_haul: Destination[] }>(
        "/destinations/popular"
      )
      .then((r) => r.data),

  getWeekendWindows: (destination: string, weeks = 8) =>
    client
      .get<WeekendWindow[]>("/search/weekend-windows", { params: { destination, weeks } })
      .then((r) => r.data),
};
