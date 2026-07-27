"use client";

import FormView from "@/components/FormView";
import HomeTabs from "@/components/HomeTabs";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const router = useRouter();

  const handleSwitchToTracking = (noForm?: string) => {
    if (noForm) {
      router.push(`/lacak?noForm=${noForm}`);
    } else {
      router.push("/lacak");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Tab Switcher */}
      <HomeTabs />

      {/* Render Active View */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <FormView onSwitchToTracking={handleSwitchToTracking} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Memuat...</div>}>
      <HomeContent />
    </Suspense>
  );
}
