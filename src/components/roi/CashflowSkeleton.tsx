import { Skeleton } from "@/components/ui/skeleton";

export const CashflowSkeleton = () => {
  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header Skeleton */}
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-theme-border" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full bg-theme-border" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24 bg-theme-border" />
                  <Skeleton className="h-3 w-16 bg-theme-border" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-8 w-20 sm:w-24 rounded-md bg-theme-border" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-md bg-theme-border" />
              <Skeleton className="h-8 w-24 sm:w-28 rounded-md bg-theme-accent/20" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Client Info Skeleton */}
        <div className="mb-6 bg-theme-card border border-theme-border rounded-2xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-theme-border" />
                <Skeleton className="h-5 w-24 bg-theme-border" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Payment Breakdown Skeleton */}
          <div className="lg:col-span-2 bg-theme-card border border-theme-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5 rounded bg-theme-accent/20" />
              <Skeleton className="h-5 w-40 bg-theme-border" />
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32 bg-theme-border" />
                  <Skeleton className="h-4 w-24 bg-theme-border" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-theme-border">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28 bg-theme-accent/20" />
                <Skeleton className="h-6 w-32 bg-theme-accent/20" />
              </div>
            </div>
          </div>

          {/* Investment Snapshot Skeleton */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-5 rounded bg-theme-accent/20" />
                <Skeleton className="h-5 w-36 bg-theme-border" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24 bg-theme-border" />
                    <Skeleton className="h-4 w-20 bg-theme-border" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Sections Skeleton */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="mb-4 bg-theme-card border border-theme-border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded bg-theme-accent/20" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48 bg-theme-border" />
                  <Skeleton className="h-3 w-64 bg-theme-border" />
                </div>
              </div>
              <Skeleton className="h-5 w-5 rounded bg-theme-border" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-theme-card border border-theme-border rounded-2xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded bg-theme-accent/20" />
      <Skeleton className="h-5 w-32 bg-theme-border" />
    </div>
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <Skeleton className="h-4 w-24 bg-theme-border" />
          <Skeleton className="h-4 w-20 bg-theme-border" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-theme-card border border-theme-border rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-5 w-5 rounded bg-theme-accent/20" />
      <Skeleton className="h-5 w-40 bg-theme-border" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg bg-theme-border" />
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-theme-border">
      <Skeleton className="h-5 w-48 bg-theme-border" />
    </div>
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-theme-border">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-theme-border" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-theme-border" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
