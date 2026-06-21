export default function MyTasksLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          {[...Array(3)].map((_, j) => (
            <div key={j} className="flex gap-4 py-3 border-b border-gray-50">
              <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
