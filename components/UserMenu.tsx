"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTransition } from "./TransitionProvider";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const { triggerSplash } = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    triggerSplash("logout", async () => {
      await signOut({ callbackUrl: '/login' });
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none rounded-full pr-1 pl-4 py-1 hover:bg-slate-50 transition-colors"
        title={user.name || "User"}
      >
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-900">{user.name}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-1.5 rounded-sm mt-0.5">{user.role || 'Staff'}</span>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 ring-2 ring-transparent group-hover:ring-indigo-200 transition-all">
          <User className="w-5 h-5" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs font-medium text-slate-500 capitalize">{user.role || 'Staff'}</p>
          </div>
          <div className="py-2">
            <Link 
              href="/dashboard" 
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400" />
              Dashboard
            </Link>
            {user.role === 'admin' && (
              <Link 
                href="/dashboard/admin" 
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <User className="w-4 h-4 mr-3 text-slate-400" />
                Pengaturan Akun
              </Link>
            )}
          </div>
          <div className="py-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
