export default function ProjectsLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
