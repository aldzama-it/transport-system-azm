"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEdit, Search, CalendarPlus } from "lucide-react";

export default function HomeTabs() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center mb-6 sm:mb-8 px-2">
      <div className="bg-slate-100 p-1 sm:p-1.5 rounded-2xl sm:rounded-full grid grid-cols-3 w-full max-w-md shadow-inner border border-slate-200/60">
        <Link
          href="/"
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 text-center ${
            pathname === "/"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <FileEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Form</span>
        </Link>
        <Link
          href="/lacak"
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 text-center ${
            pathname === "/lacak" || pathname.startsWith("/lacak/")
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Lacak</span>
        </Link>
        <Link
          href="/rutin"
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 text-center ${
            pathname === "/rutin"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Rutin</span>
        </Link>
      </div>
    </div>

  );
}
