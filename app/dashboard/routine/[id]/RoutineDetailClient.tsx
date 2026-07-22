"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Car, CheckCircle2, Clock, Calendar, MapPin, User, FileText, LayoutList, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RoutineDetailClientProps {
  routineId: number;
  readOnly: boolean;
}

const statusConfig: Record<string, { label: string, color: string }> = {
  pending: { label: 'Menunggu Persetujuan', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  granted: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  waiting_assignment: { label: 'Menunggu Penugasan', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  assigned: { label: 'Ditugaskan', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  in_progress: { label: 'Sedang Berjalan', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  done: { label: 'Selesai', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  deny: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200' },
  cancelled: { label: 'Dibatalkan', color: 'bg-stone-100 text-stone-700 border-stone-200' },
};

function formatDateTime(dateString: string | Date | null) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function formatDateOnly(dateString: string | Date | null) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function RoutineDetailClient({ routineId, readOnly }: RoutineDetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [routine, setRoutine] = useState<any>(null);
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [kendaraan, setKendaraan] = useState<any[]>([]);
  
  const [actionModal, setActionModal] = useState<'assign' | null>(null);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedKendaraan, setSelectedKendaraan] = useState<string>("");
  const [assignCatatan, setAssignCatatan] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [routRes, drvRes, kenRes] = await Promise.all([
        fetch(`/api/routine-requests/${routineId}`),
        fetch('/api/drivers'),
        fetch('/api/kendaraan')
      ]);
      const routData = await routRes.json();
      const drvData = await drvRes.json();
      const kenData = await kenRes.json();

      if (routData.success) {
        setRoutine(routData.data);
      } else {
        toast.error("Gagal memuat data pengajuan rutin");
        router.push("/dashboard");
      }
      if (drvData.success) setDrivers(drvData.data);
      if (kenData.success) setKendaraan(kenData.data);
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId]);

  const handleDone = async (childId: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/requests/${childId}/done`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Jadwal ditandai selesai");
        fetchData();
      } else {
        toast.error(data.error || "Gagal mengubah status");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setIsProcessing(true);

    try {
      // Endpoint yang digunakan adalah pengajuan normal (child form adalah Request normal)
      const endpoint = `/api/requests/${selectedChild.id}/assign`;
      const body = { driverId: selectedDriver, kendaraanId: selectedKendaraan, catatan: assignCatatan };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Jadwal harian berhasil ditugaskan");
        setActionModal(null);
        setSelectedChild(null);
        setAssignCatatan("");
        fetchData();
      } else {
        toast.error(data.error || "Gagal menyimpan penugasan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fix child requests yang masih pending padahal routine sudah active
  const handleFixPendingChildren = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/routine-requests/${routineId}/approve`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        const count = data.fixed ?? 0;
        toast.success(count > 0
          ? `${count} jadwal harian berhasil disetujui otomatis`
          : "Semua jadwal sudah dalam status yang benar"
        );
        fetchData();
      } else {
        toast.error(data.error || "Gagal memperbaiki status");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!routine) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <LayoutList className="w-6 h-6 text-indigo-600" />
              Detail Penugasan Rutin
            </h1>
            <p className="text-sm text-slate-500 font-medium">{routine.noForm} &bull; {routine.title}</p>
          </div>
        </div>
      </div>

      {/* Banner: ada child pending padahal routine sudah active */}
      {routine.status === 'active' && routine.requests?.some((r: any) => r.status === 'pending') && !readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Ada jadwal harian yang statusnya masih &quot;Menunggu Persetujuan&quot;</p>
              <p className="text-amber-700 text-xs mt-0.5">Routine ini sudah disetujui, namun {routine.requests.filter((r: any) => r.status === 'pending').length} jadwal harian belum terupdate otomatis.</p>
            </div>
          </div>
          <button
            onClick={handleFixPendingChildren}
            disabled={isProcessing}
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isProcessing ? "Memproses..." : "Perbaiki Status"}
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pemohon</p>
              <p className="font-semibold text-slate-900">{routine.requester}</p>
              <p className="text-sm text-slate-600">{routine.divisi}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Periode Rutin</p>
              <p className="font-semibold text-slate-900">
                {formatDateOnly(routine.startDate)} <span className="text-slate-400 mx-2">s/d</span> {formatDateOnly(routine.endDate)}
              </p>
              <p className="text-sm text-slate-600">Jam: {routine.departureTime} - {routine.returnTime} &bull; <span className="capitalize">{routine.repeatType}</span></p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Titik Jemput</p>
              <p className="font-semibold text-slate-900">{routine.pickup || "-"}</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tujuan</p>
              <p className="font-semibold text-slate-900">{routine.destination}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Child Requests */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Daftar Jadwal Harian</h2>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
            Total {routine.totalDaysCount ?? (routine.requests?.length || 0)} Hari
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-5">No. Form Harian</th>
                <th className="p-5">Jadwal Berangkat</th>
                <th className="p-5">Driver</th>
                <th className="p-5">Kendaraan</th>
                <th className="p-5">Status</th>
                {!readOnly && <th className="p-5 pr-6 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routine.requests?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Tidak ada jadwal harian ditemukan.
                  </td>
                </tr>
              ) : routine.requests?.map((req: any) => {
                const status = statusConfig[req.status];
                return (
                  <tr key={req.id} className={`hover:bg-slate-50 transition-colors ${req.isPreview ? 'opacity-70 bg-slate-50 border-l-4 border-l-amber-400' : ''}`}>
                    <td className="p-5 font-bold text-slate-900">
                      {req.isPreview ? <span className="text-amber-600 text-xs italic font-medium">Belum Digenerate</span> : req.noForm}
                    </td>
                    <td className="p-5">
                      <p className="font-semibold text-slate-800">{formatDateTime(req.tglMulai)}</p>
                    </td>
                    <td className="p-5">
                      {req.driver ? (
                        <div>
                          <p className="font-semibold text-slate-800">{req.driver.nama}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Belum ada</span>
                      )}
                    </td>
                    <td className="p-5">
                      {req.kendaraan ? (
                        <div>
                          <p className="font-semibold text-slate-800">{req.kendaraan.jenis}</p>
                          <p className="text-xs text-slate-500">{req.kendaraan.nopol}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Belum ada</span>
                      )}
                    </td>
                    <td className="p-5">
                      {req.isPreview ? (
                        <span className="px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider border bg-amber-100 text-amber-700 border-amber-200">
                          Preview
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider border ${status?.color || 'bg-slate-100 text-slate-600'}`}>
                          {status?.label || req.status}
                        </span>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="p-5 pr-6 text-right">
                        {req.isPreview ? (
                          <span className="text-xs font-semibold text-slate-400">Draft</span>
                        ) : (
                          <>
                            {(req.status === 'pending' || req.status === 'waiting_assignment' || req.status === 'granted') && (
                              <button
                                title="Tugaskan Driver/Kendaraan"
                                onClick={() => { 
                                  setSelectedChild(req); 
                                  setSelectedDriver(req.driver?.id?.toString() || ""); 
                                  setSelectedKendaraan(req.kendaraan?.id?.toString() || ""); 
                                  setAssignCatatan("");
                                  setActionModal('assign'); 
                                }}
                                className="p-2 bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                              >
                                <Car className="w-4 h-4 mr-2" /> Assign
                              </button>
                            )}
                            {(req.status === 'assigned' || req.status === 'done') && (
                              <span className="text-xs font-semibold text-slate-400">Ter-assign</span>
                            )}
                            {req.status === 'in_progress' && (
                              <button
                                title="Selesai"
                                onClick={() => handleDone(req.id)}
                                className="p-2 bg-green-50 text-green-600 font-semibold border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assign */}
      {actionModal === 'assign' && selectedChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Tugaskan Jadwal</h2>
              <p className="text-sm text-slate-500 mt-1">Form: <span className="font-semibold">{selectedChild.noForm}</span></p>
            </div>
            
            <form onSubmit={handleAssign} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Driver</label>
                <select
                  required
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                >
                  <option value="">-- Pilih Driver --</option>
                  {drivers.map(d => {
                    const isBusy = d.requests && d.requests.length > 0;
                    const busyText = isBusy ? ` (Sibuk di: ${d.requests.map((r: any) => r.noForm).join(', ')})` : '';
                    return (
                      <option key={d.id} value={d.id} disabled={isBusy}>
                        {d.nama}{busyText}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kendaraan</label>
                <select
                  required
                  value={selectedKendaraan}
                  onChange={(e) => setSelectedKendaraan(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {kendaraan.map(k => {
                    const isBusy = k.requests && k.requests.length > 0;
                    const busyText = isBusy ? ` (Dipakai di: ${k.requests.map((r: any) => r.noForm).join(', ')})` : '';
                    return (
                      <option key={k.id} value={k.id} disabled={isBusy}>
                        {k.jenis} - {k.nopol}{busyText}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={assignCatatan}
                  onChange={(e) => setAssignCatatan(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                  placeholder="Tambahkan catatan untuk driver..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !selectedDriver || !selectedKendaraan}
                  className="flex-1 px-4 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Simpan Penugasan</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
