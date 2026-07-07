"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Car, UserCircle, Plus, Trash2, ArrowLeft, Search, Filter, Pencil, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AssetsClient({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"driver" | "kendaraan">("driver");
  const [isLoading, setIsLoading] = useState(true);
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [kendaraan, setKendaraan] = useState<any[]>([]);

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
  const [newKendaraanProject, setNewKendaraanProject] = useState("");
  const [newKendaraanLokasi, setNewKendaraanLokasi] = useState("");
  const [isAddingKendaraan, setIsAddingKendaraan] = useState(false);

  // Search, Sort, Filter state
  const [driverSearch, setDriverSearch] = useState("");
  const [driverSort, setDriverSort] = useState<"nama_asc" | "nama_desc">("nama_asc");
  const [driverFilter, setDriverFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");

  const [kendaraanSearch, setKendaraanSearch] = useState("");
  const [kendaraanSort, setKendaraanSort] = useState<"jenis_asc" | "jenis_desc" | "nopol_asc" | "nopol_desc">("jenis_asc");
  const [kendaraanFilter, setKendaraanFilter] = useState<"semua" | "tersedia" | "tidak tersedia">("semua");

  // Edit/Delete state
  const [editDriver, setEditDriver] = useState<any>(null);
  const [editKendaraan, setEditKendaraan] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<"driver" | "kendaraan" | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [drvRes, kenRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/kendaraan')
      ]);
      const drvData = await drvRes.json();
      const kenData = await kenRes.json();
      
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
        body: JSON.stringify({ jenis: newKendaraanJenis, nopol: newKendaraanNopol, project: newKendaraanProject, lokasi: newKendaraanLokasi }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kendaraan berhasil ditambahkan");
        setIsAddKendaraanOpen(false);
        setNewKendaraanJenis("");
        setNewKendaraanNopol("");
        setNewKendaraanProject("");
        setNewKendaraanLokasi("");
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

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/drivers/${editDriver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: editDriver.nama, telepon: editDriver.telepon, status: editDriver.status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Driver berhasil diperbarui");
        setEditDriver(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal memperbarui driver");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateKendaraan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/kendaraan/${editKendaraan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: editKendaraan.jenis, nopol: editKendaraan.nopol, status: editKendaraan.status, project: editKendaraan.project, lokasi: editKendaraan.lokasi }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kendaraan berhasil diperbarui");
        setEditKendaraan(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal memperbarui kendaraan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/${deleteType === 'driver' ? 'drivers' : 'kendaraan'}/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${deleteType === 'driver' ? 'Driver' : 'Kendaraan'} berhasil dinonaktifkan`);
        setDeleteId(null);
        setDeleteType(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal menghapus data");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessingAction(false);
    }
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
        {!readOnly && activeTab === 'driver' && (
          <button
            onClick={() => setIsAddDriverOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Driver
          </button>
        )}
        {!readOnly && activeTab === 'kendaraan' && (
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
          {/* Driver Tab */}
          {activeTab === 'driver' && (() => {
            let processedDrivers = [...drivers];
            
            // Search
            if (driverSearch) {
              const lowerSearch = driverSearch.toLowerCase();
              processedDrivers = processedDrivers.filter(d => d.nama.toLowerCase().includes(lowerSearch) || (d.telepon && d.telepon.includes(driverSearch)));
            }
            
            // Filter
            if (driverFilter !== 'semua') {
              processedDrivers = processedDrivers.filter(d => d.status === driverFilter);
            }
            
            // Sort
            processedDrivers.sort((a, b) => {
              if (driverSort === 'nama_asc') return a.nama.localeCompare(b.nama);
              if (driverSort === 'nama_desc') return b.nama.localeCompare(a.nama);
              return 0;
            });
            
            const totalDriverPages = Math.ceil(processedDrivers.length / itemsPerPage) || 1;
            const currentDrivers = processedDrivers.slice((driverPage - 1) * itemsPerPage, driverPage * itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari driver..." 
                      value={driverSearch}
                      onChange={e => { setDriverSearch(e.target.value); setDriverPage(1); }}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                      value={driverFilter}
                      onChange={e => { setDriverFilter(e.target.value as any); setDriverPage(1); }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                    <select 
                      value={driverSort}
                      onChange={e => { setDriverSort(e.target.value as any); setDriverPage(1); }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="nama_asc">Nama (A-Z)</option>
                      <option value="nama_desc">Nama (Z-A)</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Driver</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. Telepon</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        {!readOnly && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentDrivers.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">Data driver tidak ditemukan.</td></tr>
                      ) : currentDrivers.map(d => (
                        <tr key={d.id} className={`hover:bg-slate-50/50 transition-colors ${d.status === 'nonaktif' ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${d.status === 'nonaktif' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                              <UserCircle className="w-6 h-6" />
                            </div>
                            {d.nama}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{d.telepon || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${d.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {d.status}
                            </span>
                          </td>
                          {!readOnly && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditDriver(d)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setDeleteId(d.id); setDeleteType('driver'); }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {processedDrivers.length > itemsPerPage && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      Menampilkan <span className="font-bold text-slate-700">{(driverPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(driverPage * itemsPerPage, processedDrivers.length)}</span> dari <span className="font-bold text-slate-700">{processedDrivers.length}</span> driver
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
            let processedKendaraan = [...kendaraan];
            
            // Search
            if (kendaraanSearch) {
              const lowerSearch = kendaraanSearch.toLowerCase();
              processedKendaraan = processedKendaraan.filter(k => k.jenis.toLowerCase().includes(lowerSearch) || k.nopol.toLowerCase().includes(lowerSearch));
            }
            
            // Filter
            if (kendaraanFilter !== 'semua') {
              processedKendaraan = processedKendaraan.filter(k => k.status === kendaraanFilter);
            }
            
            // Sort
            processedKendaraan.sort((a, b) => {
              if (kendaraanSort === 'jenis_asc') return a.jenis.localeCompare(b.jenis);
              if (kendaraanSort === 'jenis_desc') return b.jenis.localeCompare(a.jenis);
              if (kendaraanSort === 'nopol_asc') return a.nopol.localeCompare(b.nopol);
              if (kendaraanSort === 'nopol_desc') return b.nopol.localeCompare(a.nopol);
              return 0;
            });

            const totalKendaraanPages = Math.ceil(processedKendaraan.length / itemsPerPage) || 1;
            const currentKendaraan = processedKendaraan.slice((kendaraanPage - 1) * itemsPerPage, kendaraanPage * itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari kendaraan..." 
                      value={kendaraanSearch}
                      onChange={e => { setKendaraanSearch(e.target.value); setKendaraanPage(1); }}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                      value={kendaraanFilter}
                      onChange={e => { setKendaraanFilter(e.target.value as any); setKendaraanPage(1); }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="tersedia">Tersedia</option>
                      <option value="tidak tersedia">Tidak Tersedia</option>
                    </select>
                    <select 
                      value={kendaraanSort}
                      onChange={e => { setKendaraanSort(e.target.value as any); setKendaraanPage(1); }}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                    >
                      <option value="jenis_asc">Jenis (A-Z)</option>
                      <option value="jenis_desc">Jenis (Z-A)</option>
                      <option value="nopol_asc">Nopol (A-Z)</option>
                      <option value="nopol_desc">Nopol (Z-A)</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Kendaraan</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Polisi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        {!readOnly && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentKendaraan.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">Data kendaraan tidak ditemukan.</td></tr>
                      ) : currentKendaraan.map(k => (
                        <tr key={k.id} className={`hover:bg-slate-50/50 transition-colors ${k.status === 'tidak tersedia' ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                              <Car className="w-5 h-5" />
                            </div>
                            {k.jenis}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium tracking-wider">{k.nopol}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{k.project || "-"}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{k.lokasi || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${k.status === 'tersedia' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {k.status}
                            </span>
                          </td>
                          {!readOnly && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditKendaraan(k)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { setDeleteId(k.id); setDeleteType('kendaraan'); }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {processedKendaraan.length > itemsPerPage && (
                  <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                      Menampilkan <span className="font-bold text-slate-700">{(kendaraanPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(kendaraanPage * itemsPerPage, processedKendaraan.length)}</span> dari <span className="font-bold text-slate-700">{processedKendaraan.length}</span> kendaraan
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Project <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="text" value={newKendaraanProject} onChange={e => setNewKendaraanProject(e.target.value)} placeholder="Contoh: Proyek A" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lokasi <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="text" value={newKendaraanLokasi} onChange={e => setNewKendaraanLokasi(e.target.value)} placeholder="Contoh: Jakarta" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
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

      {/* Edit Driver Modal */}
      {editDriver && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Driver</h3>
            <form onSubmit={handleUpdateDriver}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input type="text" required value={editDriver.nama} onChange={e => setEditDriver({...editDriver, nama: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">No. Telepon / WhatsApp</label>
                  <input type="text" value={editDriver.telepon || ''} onChange={e => setEditDriver({...editDriver, telepon: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select value={editDriver.status} onChange={e => setEditDriver({...editDriver, status: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditDriver(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isProcessingAction || !editDriver.nama.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isProcessingAction ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Kendaraan Modal */}
      {editKendaraan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Kendaraan</h3>
            <form onSubmit={handleUpdateKendaraan}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Kendaraan</label>
                  <input type="text" required value={editKendaraan.jenis} onChange={e => setEditKendaraan({...editKendaraan, jenis: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Polisi (Plat)</label>
                  <input type="text" required value={editKendaraan.nopol} onChange={e => setEditKendaraan({...editKendaraan, nopol: e.target.value.toUpperCase()})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Project <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="text" value={editKendaraan.project || ''} onChange={e => setEditKendaraan({...editKendaraan, project: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Lokasi <span className="text-slate-400 font-normal text-xs">(Opsional)</span></label>
                  <input type="text" value={editKendaraan.lokasi || ''} onChange={e => setEditKendaraan({...editKendaraan, lokasi: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select value={editKendaraan.status} onChange={e => setEditKendaraan({...editKendaraan, status: e.target.value})} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50">
                    <option value="tersedia">Tersedia</option>
                    <option value="tidak tersedia">Tidak Tersedia</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditKendaraan(null)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Batal</button>
                <button type="submit" disabled={isProcessingAction || !editKendaraan.jenis.trim() || !editKendaraan.nopol.trim()} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isProcessingAction ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && deleteType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nonaktifkan Data</h3>
            <p className="text-slate-500 mb-6">Apakah Anda yakin ingin menonaktifkan {deleteType} ini?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setDeleteId(null); setDeleteType(null); }} className="px-5 py-2.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={isProcessingAction} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                {isProcessingAction ? "Memproses..." : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
