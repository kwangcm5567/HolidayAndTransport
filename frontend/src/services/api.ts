import axios from "axios";
import type {
  Holiday,
  TravelWindow,
  DashboardResponse,
  FlightSearchResponse,
  HotelSearchResponse,
  Destination,
  LeaveCategory,
} from "../types";

const client = axios.create({ baseURL: "/api/v1" });

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
};
