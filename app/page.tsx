"use client";

import { useState } from "react";
import FormView from "@/components/FormView";
import TrackingView from "@/components/TrackingView";
import { FileEdit, Search } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"form" | "track">("form");
  const [trackingQuery, setTrackingQuery] = useState("");

  const handleSwitchToTracking = (noForm?: string) => {
    if (noForm) {
      setTrackingQuery(noForm);
    }
    setActiveTab("track");
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1.5 rounded-full inline-flex space-x-1 shadow-inner border border-slate-200/60">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeTab === "form"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
            }`}
          >
            <FileEdit className="w-4 h-4" />
            Ajukan Form
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              activeTab === "track"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
            }`}
          >
            <Search className="w-4 h-4" />
            Lacak Status
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === "form" ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FormView onSwitchToTracking={handleSwitchToTracking} />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TrackingView initialSearchQuery={trackingQuery} />
        </div>
      )}
    </div>
  );
}
