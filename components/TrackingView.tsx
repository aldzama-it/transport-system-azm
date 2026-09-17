"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, FileText, Calendar, Building, MapPin, Car, UserCircle, AlertCircle, CheckCircle2, Clock, Ban, Phone } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  granted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Disetujui (Granted)" },
  waiting_assignment: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Menunggu Penugasan" },
  assigned: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Car, label: "Ditugaskan (Assigned)" },
  in_progress: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: MapPin, label: "Sedang Berjalan" },
  deny: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Ditolak (Deny)" },
  cancelled: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Ban, label: "Dibatalkan (Cancelled)" },
  done: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Selesai (Done)" },
};

const formatDateTime = (dateStr: string | Date, exportFormat = false) => {
  const d = new Date(dateStr);
  const timeStr = format(d, "HH:mm");
  if (timeStr === "00:00" || timeStr === "23:59") {
    return format(d, exportFormat ? "dd/MM/yyyy" : "dd MMM yyyy");
  }
  return format(d, exportFormat ? "dd/MM/yyyy HH:mm" : "dd MMM yyyy, HH:mm");
};

export default function TrackingView({ initialSearchQuery = "" }: { initialSearchQuery?: string }) {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearchQuery);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialSearchQuery);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!search.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/requests?search=${encodeURIComponent(search)}&tracking=true`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error("Gagal mengambil data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearchQuery) {
      setSearch(initialSearchQuery);
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  return (
    <div className="max-w-6xl mx-auto py-2 sm:py-8">
      <div className="text-center mb-6 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4">Lacak Permintaan</h1>
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto">
          Masukkan nomor form (contoh: AZM-FRM...) atau nama Anda untuk melacak status pengajuan penggunaan kendaraan operasional PT ALDZAMA.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 sm:pl-12 pr-20 sm:pr-32 py-3.5 sm:py-5 border-2 border-slate-200 rounded-full focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-base sm:text-lg shadow-sm bg-white"
            placeholder="No Form Lengkap / Nama"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !search.trim()}
            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-3.5 sm:px-6 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-50 shadow-sm text-xs sm:text-base min-h-[36px]"
          >
            {isLoading ? "Mencari..." : "Cari"}
          </button>
        </form>
      </div>


      {hasSearched && !isLoading && requests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Tidak ada hasil</h3>
          <p className="text-slate-500 mt-2">Pastikan nomor form atau nama yang dimasukkan benar.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const status = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={req.isRoutineParent ? `routine-${req.id}` : req.id}
                onClick={() => router.push(`/lacak/${req.isRoutineParent ? `routine-${req.id}` : req.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Form</span>
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.noForm}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-600">
                    <UserCircle className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate">{req.namaPemohon} ({req.divisi})</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{formatDateTime(req.tglMulai)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">Lihat Detail &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
