"use client";

import RoutineRequestClient from "@/components/RoutineRequestClient";
import HomeTabs from "@/components/HomeTabs";

export default function RutinPage() {
  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      {/* Tab Switcher */}
      <HomeTabs />

      {/* Render Active View */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <RoutineRequestClient />
      </div>
    </div>
  );
}
