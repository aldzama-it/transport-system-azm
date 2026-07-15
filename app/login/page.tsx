"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "@/components/TransitionProvider";
import { CarFront, Lock, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { triggerSplash } = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
        setIsSubmitting(false);
      } else {
        toast.success("Login berhasil");
        triggerSplash("login", () => {
          router.push("/dashboard");
          router.refresh();
        });
        // We do not set isSubmitting to false so the button stays disabled/loading while splashing
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 text-center bg-slate-50 border-b border-slate-100 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 bg-indigo-100 h-32 w-32 rounded-full opacity-50 blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 bg-purple-100 h-32 w-32 rounded-full opacity-50 blur-2xl"></div>
          
          <div className="relative z-10 flex justify-center mb-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-indigo-600">
              <CarFront className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 relative z-10">Portal Staff</h2>
          <p className="text-sm text-slate-500 mt-1 relative z-10">Silakan login untuk mengelola permintaan.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                placeholder="staff@transport.local"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
          >
            {isSubmitting ? "Memproses..." : "Sign In"}
          </button>
          
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              &larr; Kembali ke halaman utama
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
