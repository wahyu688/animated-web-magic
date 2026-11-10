import { Skeleton } from "@/components/ui/skeleton";

const NAV_WIDTHS = [90, 113, 136, 109, 132, 105, 128, 101];
const LIST_WIDTHS = [120, 110, 100, 90, 80];

/** First-load placeholder for the app shell ("App — Loading skeleton" frame). */
export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background" aria-busy="true" aria-label="Loading workspace">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-card px-4 pt-4 lg:flex">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-3 w-[110px] rounded-full" />
        </div>
        <Skeleton className="mt-4 h-[46px] w-full rounded-[10px]" />
        <div className="mt-5 space-y-[26px] px-1">
          {NAV_WIDTHS.map((width, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <Skeleton className="h-[18px] w-[18px] rounded-[5px]" />
              <Skeleton className="h-2.5 rounded-full" style={{ width }} />
            </div>
          ))}
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-track">
          <div className="h-full w-1/3 animate-loading-bar bg-primary motion-reduce:animate-none" />
        </div>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-8">
          <Skeleton className="h-[38px] w-full max-w-[380px] rounded-lg" />
          <div className="flex-1" />
          <Skeleton className="hidden h-9 w-[76px] rounded-lg sm:block" />
          <Skeleton className="h-[38px] w-[38px] rounded-lg" />
          <Skeleton className="hidden h-9 w-[110px] rounded-full sm:block" />
        </header>

        <main className="flex-1 overflow-hidden px-4 pt-7 sm:px-6 lg:px-8">
          <Skeleton className="h-[26px] w-[180px] rounded-lg" />
          <Skeleton className="mt-2.5 h-3.5 w-full max-w-[380px] rounded-full" />

          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-3 w-[90px] rounded-full" />
                <Skeleton className="mt-3.5 h-[26px] w-[140px] max-w-full rounded-md" />
                <Skeleton className="mt-3.5 h-[18px] w-[120px] max-w-full rounded-md" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_372px]">
            <div className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-[160px] rounded-full" />
              <Skeleton className="mt-3.5 h-3 w-[240px] max-w-full rounded-full" />
              <Skeleton className="mt-4 h-[250px] w-full rounded-lg" />
            </div>
            <div className="hidden rounded-xl border border-border bg-card p-5 xl:block">
              <Skeleton className="h-4 w-[140px] rounded-full" />
              <div className="mt-5 space-y-[18px]">
                {LIST_WIDTHS.map((width) => (
                  <div key={width} className="space-y-3.5">
                    <Skeleton className="h-3 rounded-full" style={{ width }} />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
