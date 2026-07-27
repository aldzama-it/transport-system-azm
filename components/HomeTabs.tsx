"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileEdit, Search, CalendarPlus } from "lucide-react";

export default function HomeTabs() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center mb-8">
      <div className="bg-slate-100 p-1.5 rounded-full inline-flex space-x-1 shadow-inner border border-slate-200/60">
        <Link
          href="/"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
            pathname === "/"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <FileEdit className="w-4 h-4" />
          Ajukan Form
        </Link>
        <Link
          href="/lacak"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
            pathname === "/lacak"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <Search className="w-4 h-4" />
          Lacak Status
        </Link>
        <Link
          href="/rutin"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
            pathname === "/rutin"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/50"
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          Ajukan Rutin
        </Link>
      </div>
    </div>
  );
}
