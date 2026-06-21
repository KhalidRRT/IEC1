export default function UsersLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse mb-4" />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-16 h-6 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
