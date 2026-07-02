"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Car, UserCircle, ChevronLeft, ChevronRight, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AssetsClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"jadwal" | "driver" | "kendaraan">("jadwal");
  const [isLoading, setIsLoading] = useState(true);
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [kendaraan, setKendaraan] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  // Pagination state
  const [driverPage, setDriverPage] = useState(1);
  const [kendaraanPage, setKendaraanPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [newDriverNama, setNewDriverNama] = useState("");
  const [newDriverTelepon, setNewDriverTelepon] = useState("");
  const [isAddingDriver, setIsAddingDriver] = useState(false);

  const [isAddKendaraanOpen, setIsAddKendaraanOpen] = useState(false);
  const [newKendaraanJenis, setNewKendaraanJenis] = useState("");
  const [newKendaraanNopol, setNewKendaraanNopol] = useState("");
  const [isAddingKendaraan, setIsAddingKendaraan] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, drvRes, kenRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/drivers'),
        fetch('/api/kendaraan')
      ]);
      const reqData = await reqRes.json();
      const drvData = await drvRes.json();
      const kenData = await kenRes.json();
      
      if (reqData.success) {
        // Hanya ambil jadwal yang sudah disetujui
        setRequests(reqData.data.filter((r: any) => r.status === 'granted'));
      }
      if (drvData.success) setDrivers(drvData.data);
      if (kenData.success) setKendaraan(kenData.data);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverNama.trim()) {
      toast.error("Nama driver wajib diisi");
      return;
    }
    setIsAddingDriver(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: newDriverNama, telepon: newDriverTelepon }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Driver berhasil ditambahkan");
        setIsAddDriverOpen(false);
        setNewDriverNama("");
        setNewDriverTelepon("");
        fetchData();
      } else {
        toast.error(data.error || "Gagal menambah driver");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsAddingDriver(false);
    }
  };

  const handleAddKendaraan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKendaraanJenis.trim() || !newKendaraanNopol.trim()) {
      toast.error("Jenis dan Nopol wajib diisi");
      return;
    }
    setIsAddingKendaraan(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: newKendaraanJenis, nopol: newKendaraanNopol }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kendaraan berhasil ditambahkan");
        setIsAddKendaraanOpen(false);
        setNewKendaraanJenis("");
        setNewKendaraanNopol("");
        fetchData();
      } else {
        toast.error(data.error || "Gagal menambah kendaraan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsAddingKendaraan(false);
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getBookingsForDay = (day: Date) => {
    return requests.filter(req => {
      const mulai = new Date(req.tglMulai);
      // Buang jam/menit untuk komparasi tanggal yang adil (karena input Excel dsb bisa midnight)
      mulai.setHours(0,0,0,0);
      const dayStart = new Date(day);
      dayStart.setHours(0,0,0,0);
      
      let selesai = req.tglSelesai ? new Date(req.tglSelesai) : new Date(mulai);
      selesai.setHours(23,59,59,999);
      
      return dayStart >= mulai && dayStart <= selesai;
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-2 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900">Driver & Kendaraan</h1>
          <p className="text-slate-500">Kelola jadwal pemakaian, data driver, dan armada operasional.</p>
        </div>
        {activeTab === 'driver' && (
          <button
            onClick={() => setIsAddDriverOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Driver
          </button>
        )}
        {activeTab === 'kendaraan' && (
          <button
            onClick={() => setIsAddKendaraanOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Kendaraan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm inline-flex mb-8">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'jadwal' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <CalendarIcon className="w-4 h-4" />
          Jadwal Pemakaian
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'driver' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <UserCircle className="w-4 h-4" />
          Daftar Driver
        </button>
        <button
          onClick={() => setActiveTab('kendaraan')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'kendaraan' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Car className="w-4 h-4" />
          Daftar Kendaraan
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Jadwal Tab */}
          {activeTab === 'jadwal' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-800 capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: id })}
                  </h2>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hari Ini
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 text-slate-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 text-slate-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((day, i) => {
                  const bookings = getBookingsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`min-h-[140px] p-2.5 border-b border-r border-slate-100 transition-colors hover:bg-slate-50/80 group/cell ${!isCurrentMonth ? 'bg-slate-50/40 opacity-50' : 'bg-white'} ${isTodayDate ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/10' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-transform group-hover/cell:scale-110 ${isTodayDate ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}>
                          {format(day, 'd')}
                        </span>
                        {bookings.length > 0 && (
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                            {bookings.length} Agenda
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 overflow-y-auto max-h-[100px] hide-scrollbar pr-1">
                        {bookings.map((b, idx) => {
                          // Variasi warna untuk membedakan item
                          const colorVariants = [
                            "bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white",
                            "bg-blue-600 border-blue-700 hover:bg-blue-700 text-white",
                            "bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white",
                            "bg-violet-600 border-violet-700 hover:bg-violet-700 text-white"
                          ];
                          const colorClass = colorVariants[idx % colorVariants.length];
                          
                          return (
                            <div key={b.id} className={`text-xs px-2.5 py-2 rounded-lg border shadow-sm cursor-default group relative transition-colors ${colorClass}`}>
                              <p className="font-bold truncate text-[11px] mb-0.5 flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 opacity-90" />
                                {b.kendaraan?.jenis || "Belum ada mobil"}
                              </p>
                              <p className="font-medium truncate text-[10px] flex items-center gap-1.5 opacity-90">
                                <UserCircle className="w-3.5 h-3.5" />
                                {b.driver?.nama || "Tanpa driver"}
                              </p>
                              {/* Tooltip removed per user request */}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Driver Tab */}
          {activeTab === 'driver' && (() => {
            const totalDriverPages = Math.ceil(drivers.length / itemsPerPage) || 1;
            const currentDrivers = drivers.slice((driverPage - 1) * itemsPerPage, driverPage * itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Driver</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. Telepon</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDrivers.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium">Belum ada data driver.</td></tr>
                      ) : currentDrivers.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                              <UserCircle className="w-6 h-6" />
                            </div>
                            {d.nama}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{d.telepon || "-"}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {drivers.length > itemsPerPage && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      Menampilkan <span className="font-bold text-slate-700">{(driverPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(driverPage * itemsPerPage, drivers.length)}</span> dari <span className="font-bold text-slate-700">{drivers.length}</span> driver
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDriverPage(p => Math.max(1, p - 1))}
                        disabled={driverPage === 1}
                        className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                      >
                        Sebelumnya
                      </button>
                      <button 
                        onClick={() => setDriverPage(p => Math.min(totalDriverPages, p + 1))}
                        disabled={driverPage === totalDriverPages}
                        className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Kendaraan Tab */}
          {activeTab === 'kendaraan' && (() => {
            const totalKendaraanPages = Math.ceil(kendaraan.length / itemsPerPage) || 1;
            const currentKendaraan = kendaraan.slice((kendaraanPage - 1) * itemsPerPage, kendaraanPage * itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Kendaraan</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Polisi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentKendaraan.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-medium">Belum ada data kendaraan.</td></tr>
                      ) : currentKendaraan.map(k => (
                        <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                              <Car className="w-5 h-5" />
                            </div>
                            {k.jenis}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium tracking-wider">{k.nopol}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              {k.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {kendaraan.length > itemsPerPage && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      Menampilkan <span className="font-bold text-slate-700">{(kendaraanPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(kendaraanPage * itemsPerPage, kendaraan.length)}</span> dari <span className="font-bold text-slate-700">{kendaraan.length}</span> kendaraan
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setKendaraanPage(p => Math.max(1, p - 1))}
                        disabled={kendaraanPage === 1}
                        className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                      >
                        Sebelumnya
                      </button>
                      <button 
                        onClick={() => setKendaraanPage(p => Math.min(totalKendaraanPages, p + 1))}
                        disabled={kendaraanPage === totalKendaraanPages}
                        className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Modals */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tambah Driver Baru</h3>
            <form onSubmit={handleAddDriver}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input type="text" required value={newDriverNama} onChange={e => setNewDriverNama(e.target.value)} placeholder="Masukkan nama driver..." className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">No. Telepon / WhatsApp <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="text" value={newDriverTelepon} onChange={e => setNewDriverTelepon(e.target.value)} placeholder="Contoh: 08123456789" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddDriverOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isAddingDriver || !newDriverNama.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isAddingDriver ? "Menyimpan..." : "Simpan Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddKendaraanOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tambah Kendaraan Baru</h3>
            <form onSubmit={handleAddKendaraan}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kendaraan</label>
                  <input type="text" required value={newKendaraanJenis} onChange={e => setNewKendaraanJenis(e.target.value)} placeholder="Contoh: Avanza Hitam" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Polisi (Plat)</label>
                  <input type="text" required value={newKendaraanNopol} onChange={e => setNewKendaraanNopol(e.target.value.toUpperCase())} placeholder="Contoh: B 1234 ABC" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddKendaraanOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isAddingKendaraan || !newKendaraanJenis.trim() || !newKendaraanNopol.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isAddingKendaraan ? "Menyimpan..." : "Simpan Kendaraan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
