export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
