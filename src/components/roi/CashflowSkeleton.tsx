import { Skeleton } from "@/components/ui/skeleton";

export const CashflowSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header Skeleton */}
      <header className="border-b border-[#2a3142] bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#2a3142]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full bg-[#2a3142]" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 bg-[#2a3142]" />
                  <Skeleton className="h-3 w-16 bg-[#2a3142]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-8 w-20 sm:w-24 rounded-md bg-[#2a3142]" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-md bg-[#2a3142]" />
              <Skeleton className="h-8 w-24 sm:w-28 rounded-md bg-[#CCFF00]/20" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Client Info Skeleton */}
        <div className="mb-6 bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-[#2a3142]" />
                <Skeleton className="h-5 w-24 bg-[#2a3142]" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Payment Breakdown Skeleton */}
          <div className="lg:col-span-2 bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5 rounded bg-[#CCFF00]/20" />
              <Skeleton className="h-5 w-40 bg-[#2a3142]" />
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32 bg-[#2a3142]" />
                  <Skeleton className="h-4 w-24 bg-[#2a3142]" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#2a3142]">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28 bg-[#CCFF00]/20" />
                <Skeleton className="h-6 w-32 bg-[#CCFF00]/20" />
              </div>
            </div>
          </div>

          {/* Investment Snapshot Skeleton */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 rounded bg-[#CCFF00]/20" />
                <Skeleton className="h-5 w-36 bg-[#2a3142]" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24 bg-[#2a3142]" />
                    <Skeleton className="h-4 w-20 bg-[#2a3142]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Sections Skeleton */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="mb-4 bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded bg-[#CCFF00]/20" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48 bg-[#2a3142]" />
                  <Skeleton className="h-3 w-64 bg-[#2a3142]" />
                </div>
              </div>
              <Skeleton className="h-5 w-5 rounded bg-[#2a3142]" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded bg-[#CCFF00]/20" />
      <Skeleton className="h-5 w-32 bg-[#2a3142]" />
    </div>
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <Skeleton className="h-4 w-24 bg-[#2a3142]" />
          <Skeleton className="h-4 w-20 bg-[#2a3142]" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-5 w-5 rounded bg-[#CCFF00]/20" />
      <Skeleton className="h-5 w-40 bg-[#2a3142]" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg bg-[#2a3142]" />
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-[#1a1f2e] border border-[#2a3142] rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-[#2a3142]">
      <Skeleton className="h-5 w-48 bg-[#2a3142]" />
    </div>
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-[#2a3142]">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-[#2a3142]" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-[#2a3142]" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
