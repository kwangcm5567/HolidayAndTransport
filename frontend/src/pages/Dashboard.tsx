import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useFilterStore } from "../store/filterStore";
import { LeaveTypeFilter } from "../components/filters/LeaveTypeFilter";
import { YearSelector } from "../components/filters/YearSelector";
import { HolidayCard } from "../components/holiday/HolidayCard";
import { Spinner } from "../components/ui/Spinner";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { BASE_URL } from "../services/api";

export function Dashboard() {
  const { year, category } = useFilterStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", year, category],
    queryFn: () => api.getDashboard(year, category),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap gap-6 items-start">
        <YearSelector />
        <LeaveTypeFilter />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-gray-500 mt-3 text-sm">正在加载新加坡假期数据...</p>
          </div>
        </div>
      )}

      {isError && (
        <ErrorAlert message={`无法加载数据。后端地址：${BASE_URL}。请检查网络或 VITE_API_URL 配置。`} />
      )}

      {data && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {data.year} 年 · {data.total_holidays} 个公假 · 显示 {data.windows.length} 个出行窗口
            </p>
            <p className="text-xs text-gray-400">更新于 {new Date(data.last_updated).toLocaleString("zh-SG")}</p>
          </div>

          {data.windows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">暂无符合条件的出行窗口</p>
              <p className="text-sm mt-1">请尝试放宽年假筛选条件</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.windows.map((win) => (
                <HolidayCard key={`${win.holiday_id}-${win.category}`} window={win} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
