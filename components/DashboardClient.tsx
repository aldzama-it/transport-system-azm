"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Search, FileText, Calendar, Building, MapPin, 
  Car, UserCircle, AlertCircle, CheckCircle2, 
  Clock, Ban, Filter, Check, X, LayoutGrid, List, ChevronDown, Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  granted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Disetujui (Granted)" },
  deny: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Ditolak (Deny)" },
  cancelled: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Ban, label: "Dibatalkan (Cancelled)" },
  done: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Selesai (Done)" },
};

export default function DashboardClient({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [kendaraan, setKendaraan] = useState<any[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDivisi, setFilterDivisi] = useState<string>("all");
  const [filterKendaraan, setFilterKendaraan] = useState<string>("all");
  const [filterDriver, setFilterDriver] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<"assign" | "deny" | "done" | null>(null);
  
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedKendaraan, setSelectedKendaraan] = useState("");
  const [alasanDeny, setAlasanDeny] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, drvRes, kenRes] = await Promise.all([
        fetch(`/api/requests${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`),
        fetch('/api/drivers'),
        fetch('/api/kendaraan')
      ]);
      const reqData = await reqRes.json();
      const drvData = await drvRes.json();
      const kenData = await kenRes.json();
      
      if (reqData.success) setRequests(reqData.data);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  let processedRequests = [...requests];

  if (search) {
    const q = search.toLowerCase();
    processedRequests = processedRequests.filter(r => r.noForm.toLowerCase().includes(q) || r.namaPemohon.toLowerCase().includes(q));
  }
  
  if (filterDivisi !== "all") {
    processedRequests = processedRequests.filter(r => r.divisi === filterDivisi);
  }

  if (filterKendaraan !== "all") {
    if (filterKendaraan === "none") {
      processedRequests = processedRequests.filter(r => !r.kendaraan);
    } else {
      processedRequests = processedRequests.filter(r => r.kendaraan?.id === Number(filterKendaraan));
    }
  }

  if (filterDriver !== "all") {
    if (filterDriver === "none") {
      processedRequests = processedRequests.filter(r => !r.driver);
    } else {
      processedRequests = processedRequests.filter(r => r.driver?.id === Number(filterDriver));
    }
  }

  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    processedRequests = processedRequests.filter(r => new Date(r.tglMulai) >= from);
  }
  
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    processedRequests = processedRequests.filter(r => new Date(r.tglMulai) <= to);
  }

  const uniqueDivisi = Array.from(new Set(requests.map(r => r.divisi))).filter(Boolean);

  processedRequests.sort((a, b) => {
    const dateA = new Date(a.tglMulai).getTime();
    const dateB = new Date(b.tglMulai).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      let endpoint = `/api/requests/${selectedRequest.id}/`;
      let body: any = {};

      if (actionModal === 'assign') {
        endpoint += 'assign';
        body = { driverId: selectedDriver, kendaraanId: selectedKendaraan };
      } else if (actionModal === 'deny') {
        endpoint += 'deny';
        body = { alasanDeny };
      } else if (actionModal === 'done') {
        endpoint += 'done';
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Tindakan berhasil disimpan");
        setActionModal(null);
        setSelectedRequest(null);
        fetchData();
      } else {
        toast.error(data.error || "Gagal menyimpan");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsProcessing(false);
    }
  };

  const statTotal = requests.length;
  const statPending = requests.filter(r => r.status === 'pending').length;
  const statGranted = requests.filter(r => r.status === 'granted').length;
  const statDone = requests.filter(r => r.status === 'done').length;
  const statDeny = requests.filter(r => r.status === 'deny').length;
  const statCancelled = requests.filter(r => r.status === 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{readOnly ? "Monitoring" : "Dashboard"}</h1>
          <p className="text-slate-500">Kelola permintaan kendaraan operasional.</p>
        </div>
        
        <button
          onClick={() => {
            if (requests.length === 0) {
              toast.error("Tidak ada data untuk diekspor");
              return;
            }
            const exportData = requests.map(req => ({
              "No Form": req.noForm,
              "Pemohon": req.namaPemohon,
              "Divisi": req.divisi,
              "Tujuan": req.tujuan,
              "Tgl Mulai": format(new Date(req.tglMulai), "dd/MM/yyyy HH:mm"),
              "Tgl Selesai": format(new Date(req.tglSelesai), "dd/MM/yyyy HH:mm"),
              "Status": statusConfig[req.status]?.label || req.status,
              "Driver": req.driver ? req.driver.nama : "-",
              "Kendaraan": req.kendaraan ? req.kendaraan.jenis : "-",
              "No. Polisi": req.kendaraan ? req.kendaraan.nopol : "-",
              "Waktu Pengajuan": format(new Date(req.createdAt), "dd/MM/yyyy HH:mm")
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data Transport");
            XLSX.writeFile(workbook, `Data_Transport_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
            toast.success("Data berhasil diekspor ke Excel");
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Total Form</span>
          <span className="text-2xl font-black text-slate-800">{statTotal}</span>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-amber-700 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Menunggu</span>
          <span className="text-2xl font-black text-amber-600">{statPending}</span>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Disetujui</span>
          <span className="text-2xl font-black text-blue-600">{statGranted}</span>
        </div>
        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-green-700 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Selesai</span>
          <span className="text-2xl font-black text-green-600">{statDone}</span>
        </div>
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-red-700 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Ditolak</span>
          <span className="text-2xl font-black text-red-600">{statDeny}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 text-center">Dibatalkan</span>
          <span className="text-2xl font-black text-slate-500">{statCancelled}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari form / nama..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-slate-50"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-600 text-slate-600 font-medium w-full sm:w-auto"
              title="Tanggal Mulai (Dari)"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-600 text-slate-600 font-medium w-full sm:w-auto"
              title="Tanggal Mulai (Sampai)"
            />
          </div>
          
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-500">Memuat data...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
          {openDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-indigo-600 border-b border-indigo-700 text-sm font-semibold text-white uppercase tracking-wider">
                  <th className="p-5 pl-6 align-middle"><span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">No Form</span></th>
                  <th className="p-5 align-middle"><span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Pemohon</span></th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-1.5 w-max">
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Divisi</span>
                      {filterDivisi !== 'all' && (
                        <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold max-w-[80px] truncate">{filterDivisi}</span>
                      )}
                      <div className="relative flex items-center justify-center">
                        <button onClick={() => setOpenDropdown(openDropdown === 'divisi' ? null : 'divisi')} className="focus:outline-none">
                          <ChevronDown className="w-4 h-4 text-indigo-300 hover:text-white cursor-pointer" />
                        </button>
                        {openDropdown === 'divisi' && (
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 capitalize">
                            <button onClick={() => { setFilterDivisi('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterDivisi === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Semua Divisi</button>
                            {uniqueDivisi.map(d => (
                              <button key={d as string} onClick={() => { setFilterDivisi(d as string); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterDivisi === (d as string) ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>{d as string}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Jadwal</span>
                      <span className="text-indigo-200 bg-indigo-900/50 rounded-md px-1.5 py-0.5 text-xs group-hover:bg-indigo-800 group-hover:text-white transition-colors font-bold">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    </div>
                  </th>
                  <th className="p-5 align-middle"><span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Tujuan</span></th>
                  <th className="p-5 align-middle"><span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Bukti</span></th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-1.5 w-max">
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Driver</span>
                      {filterDriver !== 'all' && (
                        <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold max-w-[80px] truncate">
                          {filterDriver === 'none' ? 'Kosong' : drivers.find(d => d.id === Number(filterDriver))?.nama || 'Pilih'}
                        </span>
                      )}
                      <div className="relative flex items-center justify-center">
                        <button onClick={() => setOpenDropdown(openDropdown === 'driver' ? null : 'driver')} className="focus:outline-none">
                          <ChevronDown className="w-4 h-4 text-indigo-300 hover:text-white cursor-pointer" />
                        </button>
                        {openDropdown === 'driver' && (
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 capitalize">
                            <button onClick={() => { setFilterDriver('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterDriver === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Semua Driver</button>
                            <button onClick={() => { setFilterDriver('none'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterDriver === 'none' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Belum Ditugaskan</button>
                            {drivers.map(d => (
                              <button key={d.id} onClick={() => { setFilterDriver(d.id.toString()); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterDriver === d.id.toString() ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>{d.nama}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-1.5 w-max">
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Kendaraan</span>
                      {filterKendaraan !== 'all' && (
                        <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold max-w-[80px] truncate">
                          {filterKendaraan === 'none' ? 'Kosong' : kendaraan.find(k => k.id === Number(filterKendaraan))?.nopol || 'Pilih'}
                        </span>
                      )}
                      <div className="relative flex items-center justify-center">
                        <button onClick={() => setOpenDropdown(openDropdown === 'kendaraan' ? null : 'kendaraan')} className="focus:outline-none">
                          <ChevronDown className="w-4 h-4 text-indigo-300 hover:text-white cursor-pointer" />
                        </button>
                        {openDropdown === 'kendaraan' && (
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 capitalize">
                            <button onClick={() => { setFilterKendaraan('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterKendaraan === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Semua Kendaraan</button>
                            <button onClick={() => { setFilterKendaraan('none'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterKendaraan === 'none' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Belum Ditugaskan</button>
                            {kendaraan.map(k => (
                              <button key={k.id} onClick={() => { setFilterKendaraan(k.id.toString()); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterKendaraan === k.id.toString() ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>{k.nopol}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-1.5 w-max">
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Status</span>
                      {filterStatus !== 'all' && (
                        <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold max-w-[80px] truncate">
                          {statusConfig[filterStatus]?.label}
                        </span>
                      )}
                      <div className="relative flex items-center justify-center">
                        <button onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} className="focus:outline-none">
                          <ChevronDown className="w-4 h-4 text-indigo-300 hover:text-white cursor-pointer" />
                        </button>
                        {openDropdown === 'status' && (
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 capitalize">
                            <button onClick={() => { setFilterStatus('all'); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterStatus === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>Semua Status</button>
                            {Object.keys(statusConfig).map(k => (
                              <button key={k} onClick={() => { setFilterStatus(k); setOpenDropdown(null); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterStatus === k ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}>{statusConfig[k].label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="p-5 pr-6 align-middle text-right"><span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500 bg-white">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-700">Tidak ada permintaan</h3>
                    </td>
                  </tr>
                ) : processedRequests.map(req => {
                  const status = statusConfig[req.status];
                  return (
                    <tr key={req.id} className="even:bg-slate-50 odd:bg-white hover:bg-slate-100 transition-colors">
                      <td className="p-5 pl-6 font-bold text-slate-900">{req.noForm}</td>
                      <td className="p-5">
                        <p className="font-semibold text-slate-800">{req.namaPemohon}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-600">{req.divisi}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-800 font-medium">{format(new Date(req.tglMulai), "dd MMM yyyy, HH:mm")}</p>
                        <p className="text-xs text-slate-500">s/d {format(new Date(req.tglSelesai), "dd MMM yyyy, HH:mm")}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-700 line-clamp-2 max-w-[200px]" title={req.tujuan}>{req.tujuan}</p>
                      </td>
                      <td className="p-5">
                        {req.buktiFileUrl ? (
                          <a href={req.buktiFileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium">
                            <FileText className="w-4 h-4" /> Lihat
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-5">
                        {req.driver ? (
                          <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block">{req.driver.nama}</p>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-5">
                        {req.kendaraan ? (
                          <p className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">{req.kendaraan.jenis} ({req.kendaraan.nopol})</p>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-start gap-1.5 w-max">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                            {status.label}
                          </span>
                          {req.status === 'deny' && req.alasanDeny && (
                            <span className="text-[10px] text-red-600 max-w-[140px] line-clamp-2 whitespace-normal break-words" title={req.alasanDeny}>
                              <span className="font-semibold text-red-700">Alasan:</span> {req.alasanDeny}
                            </span>
                          )}
                          {req.status === 'cancelled' && req.alasanCancel && (
                            <span className="text-[10px] text-slate-500 max-w-[140px] line-clamp-2 whitespace-normal break-words" title={req.alasanCancel}>
                              <span className="font-semibold text-slate-600">Alasan:</span> {req.alasanCancel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5 pr-6 text-right space-x-2 min-w-[200px]">
                        <button 
                          onClick={async () => {
                            const res = await fetch(`/api/requests/${req.id}`);
                            const data = await res.json();
                            if (data.success) setSelectedRequest(data.data);
                          }}
                          className="px-3 py-1.5 bg-white text-slate-600 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm shadow-sm inline-block"
                        >
                          Detail
                        </button>
                        
                        {!readOnly && req.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => { setSelectedRequest(req); setActionModal('assign'); }}
                              className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm inline-block"
                            >
                              Setujui
                            </button>
                            <button 
                              onClick={() => { setSelectedRequest(req); setActionModal('deny'); }}
                              className="px-3 py-1.5 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors text-sm shadow-sm border border-red-200 inline-block"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {!readOnly && req.status === 'granted' && (
                          <button 
                            onClick={() => { setSelectedRequest(req); setActionModal('done'); }}
                            className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm inline-block"
                          >
                            Selesai
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && !actionModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[selectedRequest.status].color} mb-2`}>
                  {statusConfig[selectedRequest.status].label}
                </span>
                <h2 className="text-2xl font-black text-slate-900">{selectedRequest.noForm}</h2>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-grow space-y-8">
              {/* Detail content similar to tracking page but stacked */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Informasi Pemohon</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">{selectedRequest.namaPemohon}</p>
                  <p className="text-slate-600">{selectedRequest.divisi}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Jadwal & Tujuan</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="font-bold text-slate-900 text-sm">
                    {format(new Date(selectedRequest.tglMulai), "dd MMM yyyy, HH:mm")} <span className="text-slate-400 font-normal mx-2">s/d</span> {format(new Date(selectedRequest.tglSelesai), "dd MMM yyyy, HH:mm")}
                  </p>
                  <p className="text-slate-700">{selectedRequest.tujuan}</p>
                  <a 
                    href={selectedRequest.buktiFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <FileText className="w-4 h-4 mr-1" /> Lihat Dokumen Bukti
                  </a>
                </div>
              </div>

              {(selectedRequest.status === 'granted' || selectedRequest.status === 'done') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Penugasan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 min-h-[90px] flex flex-col justify-center">
                      <span className="text-xs font-semibold text-indigo-600 uppercase">Driver</span>
                      <p className="font-bold text-slate-900 mt-1">{selectedRequest.driver?.nama}</p>
                    </div>
                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 min-h-[90px] flex flex-col justify-center">
                      <span className="text-xs font-semibold text-indigo-600 uppercase">Kendaraan</span>
                      <p className="font-bold text-slate-900 mt-1">{selectedRequest.kendaraan?.jenis}</p>
                      <p className="text-xs font-medium text-slate-600 mt-1">{selectedRequest.kendaraan?.nopol}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Riwayat</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {selectedRequest.history.map((hist: any) => {
                    const stat = statusConfig[hist.status];
                    return (
                      <div key={hist.id} className="relative flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative z-10 ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <div className="pt-1 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-1">
                          <p className="font-bold text-slate-800 text-sm">{stat.label}</p>
                          {hist.catatan && <p className="text-sm text-slate-600 mt-1">{hist.catatan}</p>}
                          <p className="text-xs text-slate-400 mt-2">{format(new Date(hist.createdAt), "dd MMM yyyy HH:mm")} {hist.staff && `- ${hist.staff.nama}`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modals */}
      {actionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {actionModal === 'assign' ? 'Setujui & Tugaskan' : actionModal === 'deny' ? 'Tolak Permintaan' : 'Tandai Selesai'}
            </h3>
            
            <form onSubmit={handleAction}>
              {actionModal === 'assign' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Driver</label>
                    <select 
                      required 
                      value={selectedDriver} 
                      onChange={e => setSelectedDriver(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                    >
                      <option value="">-- Pilih Driver --</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kendaraan</label>
                    <select 
                      required 
                      value={selectedKendaraan} 
                      onChange={e => setSelectedKendaraan(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                    >
                      <option value="">-- Pilih Kendaraan --</option>
                      {kendaraan.map(k => <option key={k.id} value={k.id}>{k.jenis} - {k.nopol}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {actionModal === 'deny' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alasan Penolakan</label>
                  <textarea
                    required
                    rows={3}
                    value={alasanDeny}
                    onChange={(e) => setAlasanDeny(e.target.value)}
                    className="block w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 bg-slate-50 resize-none"
                  />
                </div>
              )}
              
              {actionModal === 'done' && (
                <p className="text-slate-600 mb-6">Apakah Anda yakin menandai permintaan ini sebagai selesai?</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-6 py-2 text-white font-bold rounded-full transition-colors disabled:opacity-50 ${
                    actionModal === 'deny' ? 'bg-red-600 hover:bg-red-700' : 
                    actionModal === 'done' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isProcessing ? "Menyimpan..." : actionModal === 'assign' ? 'Setujui' : actionModal === 'deny' ? 'Tolak' : 'Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
