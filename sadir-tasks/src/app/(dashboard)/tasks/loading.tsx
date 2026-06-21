export default function TasksLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-2 mb-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50">
            <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
