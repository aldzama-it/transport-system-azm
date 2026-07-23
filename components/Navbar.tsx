import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Car } from "lucide-react";
import UserMenu from "./UserMenu";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-2.5 text-slate-800 hover:text-indigo-700 transition">
            <div className="flex items-center justify-center">
              <Image src="/Symbol.png" alt="Logo" width={64} height={64} className="object-contain" style={{ width: "auto", height: "auto" }} />
            </div>
            <span className="hidden sm:inline font-extrabold text-xl tracking-tight">Transport Aldzama</span>
          </Link>

          {/* Profile - Right */}
          <div className="flex items-center">
            {session && session.user ? (
              <UserMenu user={session.user} />
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
