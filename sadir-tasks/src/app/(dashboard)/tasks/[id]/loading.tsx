export default function TaskDetailLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
