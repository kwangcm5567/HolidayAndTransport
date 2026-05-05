import { useFilterStore } from "../../store/filterStore";

export function YearSelector() {
  const { year, setYear } = useFilterStore();
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">年份</p>
      <div className="flex gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              year === y
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}
