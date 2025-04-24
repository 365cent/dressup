export default function MLDashboardLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-10 animate-pulse mr-4"></div>
            <div className="h-8 w-64 bg-white bg-opacity-10 animate-pulse rounded"></div>
          </div>
        </div>

        <div className="h-12 w-full bg-white bg-opacity-10 animate-pulse rounded mb-6"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-48 bg-white bg-opacity-5 animate-pulse rounded"></div>
          <div className="h-48 bg-white bg-opacity-5 animate-pulse rounded"></div>
        </div>

        <div className="h-64 bg-white bg-opacity-5 animate-pulse rounded mb-6"></div>
        <div className="h-80 bg-white bg-opacity-5 animate-pulse rounded"></div>
      </div>
    </div>
  )
}
