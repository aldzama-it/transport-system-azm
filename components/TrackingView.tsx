"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, FileText, Calendar, Building, MapPin, Car, UserCircle, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  granted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Disetujui (Granted)" },
  deny: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Ditolak (Deny)" },
  cancelled: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Ban, label: "Dibatalkan (Cancelled)" },
  done: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Selesai (Done)" },
};

export default function TrackingView({ initialSearchQuery = "" }: { initialSearchQuery?: string }) {
  const router = useRouter();
  
  const [search, setSearch] = useState(initialSearchQuery);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialSearchQuery);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!search.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const res = await fetch(`/api/requests?search=${encodeURIComponent(search)}`);
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

  const fetchRequestDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedRequest(data.data);
      } else {
        toast.error("Gagal mengambil detail");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasanCancel: cancelReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Permintaan berhasil dibatalkan");
        setIsCancelModalOpen(false);
        setCancelReason("");
        // Refresh detail
        fetchRequestDetails(selectedRequest.id);
        // Refresh list
        handleSearch();
      } else {
        toast.error(data.error || "Gagal membatalkan permintaan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">Lacak Permintaan</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Masukkan nomor form (contoh: AZM-FRM...) atau nama Anda untuk melacak status pengajuan penggunaan kendaraan operasional PT ALDZAMA.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 sm:pl-12 pr-24 sm:pr-32 py-4 sm:py-5 border-2 border-slate-200 rounded-full focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all text-base sm:text-lg shadow-sm bg-white"
            placeholder="No Form atau Nama Pemohon..."
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !search.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-50 shadow-sm text-sm sm:text-base"
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

      {requests.length > 0 && !selectedRequest && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const status = statusConfig[req.status];
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={req.id}
                onClick={() => fetchRequestDetails(req.id)}
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
                    <span>{format(new Date(req.tglMulai), "dd MMM yyyy, HH:mm")}</span>
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

      {selectedRequest && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative mt-8">
          <div className="bg-slate-50 px-6 sm:px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-20">
            <div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 mb-2 inline-block"
              >
                &larr; Kembali ke daftar
              </button>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                {selectedRequest.noForm}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig[selectedRequest.status].color}`}>
                  {statusConfig[selectedRequest.status].label}
                </span>
              </h2>
            </div>
            
            {(selectedRequest.status === "pending" || selectedRequest.status === "granted") && (
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2 border-2 border-red-200 text-red-600 font-semibold rounded-full hover:bg-red-50 focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Batalkan Permintaan
              </button>
            )}
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pemohon</span>
                  <p className="font-bold text-slate-900 text-lg mt-1">{selectedRequest.namaPemohon}</p>
                  <p className="text-slate-600 flex items-center gap-1 mt-1"><Building className="w-4 h-4"/> {selectedRequest.divisi}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Jadwal</span>
                  <p className="font-bold text-slate-900 mt-1">Mulai: {format(new Date(selectedRequest.tglMulai), "dd MMM yyyy, HH:mm")}</p>
                  <p className="font-bold text-slate-900 mt-1">Selesai: {format(new Date(selectedRequest.tglSelesai), "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500"/> Tujuan Penggunaan</h3>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-700">
                  {selectedRequest.tujuan}
                </div>
              </div>

              {selectedRequest.status === 'deny' && selectedRequest.alasanDeny && (
                 <div>
                 <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2"><Ban className="w-5 h-5"/> Alasan Penolakan</h3>
                 <div className="bg-red-50 p-5 rounded-2xl border border-red-200 text-red-800">
                   {selectedRequest.alasanDeny}
                 </div>
               </div>
              )}

              {selectedRequest.status === 'cancelled' && selectedRequest.alasanCancel && (
                 <div>
                 <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2"><Ban className="w-5 h-5"/> Alasan Dibatalkan</h3>
                 <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-slate-800">
                   {selectedRequest.alasanCancel}
                 </div>
               </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><UserCircle className="w-5 h-5 text-indigo-500"/> Driver</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 min-h-[100px] flex flex-col justify-center">
                    {selectedRequest.driver ? (
                      <p className="font-bold text-slate-900">{selectedRequest.driver.nama}</p>
                    ) : (
                      <p className="text-slate-500 italic">Belum ditentukan</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Car className="w-5 h-5 text-indigo-500"/> Kendaraan</h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 min-h-[100px] flex flex-col justify-center">
                    {selectedRequest.kendaraan ? (
                      <>
                        <p className="font-bold text-slate-900">{selectedRequest.kendaraan.jenis}</p>
                        <p className="text-sm font-semibold text-slate-600 px-2 py-1 bg-slate-200 rounded inline-block mt-2 self-start">{selectedRequest.kendaraan.nopol}</p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">Belum ditentukan</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500"/> Bukti Persetujuan</h3>
                <a 
                  href={selectedRequest.buktiFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Lihat Dokumen
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Riwayat Status</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {selectedRequest.history.map((hist: any, index: number) => {
                  const stat = statusConfig[hist.status];
                  const Icon = stat.icon;
                  return (
                    <div key={hist.id} className="relative flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative z-10 ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="pt-1 flex-1">
                        <p className="font-bold text-slate-800 text-sm">{stat.label}</p>
                        {hist.catatan && <p className="text-sm text-slate-600 mt-1">{hist.catatan}</p>}
                        <p className="text-xs text-slate-400 mt-1 font-medium">{format(new Date(hist.createdAt), "dd MMM yyyy HH:mm")}</p>
                        {hist.staff && <p className="text-xs text-indigo-600 mt-1">oleh: {hist.staff.nama}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Batalkan Permintaan</h3>
            <p className="text-sm text-slate-500 mb-6">Tindakan ini tidak dapat diurungkan. Silakan masukkan alasan pembatalan.</p>
            
            <form onSubmit={handleCancel}>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Alasan pembatalan..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || !cancelReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? "Memproses..." : "Ya, Batalkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
