import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/AuthProvider";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Transport System",
  description: "Sistem Permintaan Penggunaan Kendaraan Kantor",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${font.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
