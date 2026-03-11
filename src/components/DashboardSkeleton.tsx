import React from "react";

export default function DashboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #eff6ff 4%, #e0e7ff 25%, #eff6ff 36%);
          background-size: 1000px 100%;
        }
        /* Penyesuaian untuk mode gelap jika diaktifkan nanti */
        .dark .skeleton-shimmer {
          background: linear-gradient(to right, #1e293b 4%, #334155 25%, #1e293b 36%);
        }
      `}</style>

      <div className="bg-background text-foreground antialiased min-h-screen flex overflow-hidden w-full">
        {/* --- SIDEBAR SKELETON --- */}
        <aside className="w-64 border-r border-border bg-card flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <div className="skeleton-shimmer h-8 w-8 rounded-lg"></div>
            <div className="skeleton-shimmer h-5 w-24 ml-3 rounded"></div>
          </div>
          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            <div className="flex items-center px-4 py-3 bg-primary/5 rounded-lg">
              <div className="skeleton-shimmer h-5 w-5 rounded"></div>
              <div className="skeleton-shimmer h-4 w-24 ml-4 rounded"></div>
            </div>
            {[20, 28, 16].map((width, i) => (
              <div key={i} className="flex items-center px-4 py-3">
                <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                <div className={`skeleton-shimmer h-4 w-${width} ml-4 rounded`}></div>
              </div>
            ))}
            <div className="pt-6 mt-6 border-t border-border">
              <div className="px-4 mb-2">
                <div className="skeleton-shimmer h-3 w-12 rounded"></div>
              </div>
              <div className="flex items-center px-4 py-3">
                <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                <div className="skeleton-shimmer h-4 w-24 ml-4 rounded"></div>
              </div>
              <div className="flex items-center px-4 py-3">
                <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                <div className="skeleton-shimmer h-4 w-20 ml-4 rounded"></div>
              </div>
            </div>
          </div>
          {/* User Profile Bottom */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center">
              <div className="skeleton-shimmer h-10 w-10 rounded-full"></div>
              <div className="ml-3">
                <div className="skeleton-shimmer h-3.5 w-24 mb-2 rounded"></div>
                <div className="skeleton-shimmer h-3 w-16 rounded"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main aria-busy="true" role="progressbar" className="flex-1 flex flex-col h-screen overflow-y-auto relative">
          {/* Subtle Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/10">
            <div className="h-full bg-primary w-1/3 animate-[pulse_2s_infinite]"></div>
          </div>

          {/* Header Skeleton */}
          <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <div className="skeleton-shimmer h-4 w-24 rounded hidden md:block"></div>
              <div className="h-4 w-px bg-border hidden md:block"></div>
              <div className="skeleton-shimmer h-4 w-32 rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="skeleton-shimmer h-9 w-64 rounded-lg hidden sm:block"></div>
              <div className="skeleton-shimmer h-9 w-9 rounded-lg"></div>
              <div className="skeleton-shimmer h-9 w-9 rounded-lg"></div>
            </div>
          </header>

          {/* Dashboard Content Skeleton */}
          <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Page Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="skeleton-shimmer h-8 w-48 rounded-lg mb-2"></div>
                <div className="skeleton-shimmer h-4 w-64 rounded"></div>
              </div>
              <div className="flex space-x-3">
                <div className="skeleton-shimmer h-10 w-24 rounded-xl"></div>
                <div className="skeleton-shimmer h-10 w-32 rounded-xl"></div>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[24, 20, 28, 16].map((width, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between h-36">
                  <div className="flex justify-between items-start">
                    <div className={`skeleton-shimmer h-4 w-${width} rounded`}></div>
                    <div className="skeleton-shimmer h-12 w-12 rounded-xl"></div>
                  </div>
                  <div className="mt-4">
                    <div className="skeleton-shimmer h-8 w-24 mb-2 rounded"></div>
                    <div className="skeleton-shimmer h-3 w-16 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Chart & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Chart Placeholder */}
              <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div className="skeleton-shimmer h-5 w-32 rounded"></div>
                  <div className="skeleton-shimmer h-8 w-24 rounded-lg"></div>
                </div>
                <div className="skeleton-shimmer h-[260px] w-full rounded-xl"></div>
                <div className="flex justify-between mt-6 px-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-shimmer h-3 w-8 rounded"></div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <div className="skeleton-shimmer h-5 w-28 rounded"></div>
                  <div className="skeleton-shimmer h-4 w-4 rounded-full"></div>
                </div>
                <div className="space-y-6 flex-1">
                  {[
                    { w1: "3/4", w2: "1/2" },
                    { w1: "5/6", w2: "1/3" },
                    { w1: "2/3", w2: "1/2" },
                    { w1: "3/4", w2: "1/4" },
                  ].map((widths, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="skeleton-shimmer h-10 w-10 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className={`skeleton-shimmer h-3 w-${widths.w1} rounded`}></div>
                        <div className={`skeleton-shimmer h-2 w-${widths.w2} rounded`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Cards Grid / Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div className="skeleton-shimmer h-5 w-36 rounded"></div>
                <div className="skeleton-shimmer h-8 w-24 rounded-lg"></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Table Row Simulator Header */}
                  <div className="flex gap-4 pb-4 border-b border-border">
                    <div className="skeleton-shimmer h-4 w-1/3 rounded"></div>
                    <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                    <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                    <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                  </div>
                  {/* Table Rows */}
                  {[32, 24, 40, 28].map((width, i) => (
                    <div key={i} className="flex gap-4 items-center py-3">
                      <div className="flex items-center gap-3 w-1/3">
                        <div className="skeleton-shimmer h-8 w-8 rounded-lg"></div>
                        <div className={`skeleton-shimmer h-4 w-${width} rounded`}></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-1/6 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}