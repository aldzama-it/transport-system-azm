"use client";

import TrackingView from "@/components/TrackingView";
import HomeTabs from "@/components/HomeTabs";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LacakContent() {
  const searchParams = useSearchParams();
  const [trackingQuery, setTrackingQuery] = useState("");

  useEffect(() => {
    const noForm = searchParams.get("noForm");
    if (noForm) {
      setTrackingQuery(noForm);
    }
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Tab Switcher */}
      <HomeTabs />

      {/* Render Active View */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TrackingView initialSearchQuery={trackingQuery} />
      </div>
    </div>
  );
}

export default function LacakPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Memuat...</div>}>
      <LacakContent />
    </Suspense>
  );
}
