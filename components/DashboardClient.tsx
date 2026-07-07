"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search, FileText, Calendar, Building, MapPin,
  Car, UserCircle, AlertCircle, CheckCircle2,
  Clock, Ban, Filter, Check, X, LayoutGrid, List, ChevronDown, Download, Plus, Upload, Eye, Trash2, CheckSquare, RefreshCw, Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./TrackingMap'), { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50"><span className="animate-pulse">Memuat peta...</span></div> });

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  pending: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  granted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Disetujui (Granted)" },
  deny: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Ditolak (Deny)" },
  cancelled: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Ban, label: "Dibatalkan (Cancelled)" },
  done: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Selesai (Done)" },
};

const formatDateTime = (dateStr: string | Date | null, exportFormat = false) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const timeStr = format(d, "HH:mm");
  if (timeStr === "00:00" || timeStr === "23:59") {
    return format(d, exportFormat ? "dd/MM/yyyy" : "dd MMM yyyy");
  }
  return format(d, exportFormat ? "dd/MM/yyyy HH:mm" : "dd MMM yyyy, HH:mm");
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
  const [sortField, setSortField] = useState<"tglMulai" | "noForm" | "createdAt">("noForm");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDivisi, filterKendaraan, filterDriver, search, dateFrom, dateTo, sortOrder, sortField]);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<"assign" | "deny" | "done" | "delete" | "delete-all" | null>(null);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [liveLocation, setLiveLocation] = useState<{ latitude: number, longitude: number, speed: string, lastUpdated: string } | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedKendaraan, setSelectedKendaraan] = useState("");

  const busyDriverIds = new Set(
    requests
      .filter(r => (r.status === 'pending' || r.status === 'granted') && r.id !== selectedRequest?.id)
      .map(r => r.driver?.id)
      .filter(Boolean)
  );

  const busyKendaraanIds = new Set(
    requests
      .filter(r => (r.status === 'pending' || r.status === 'granted') && r.id !== selectedRequest?.id)
      .map(r => r.kendaraan?.id)
      .filter(Boolean)
  );

  const availableDrivers = drivers.filter(d => !busyDriverIds.has(d.id));
  const availableKendaraan = kendaraan.filter(k => !busyKendaraanIds.has(k.id));
  const [assignCatatan, setAssignCatatan] = useState("");
  const [alasanDeny, setAlasanDeny] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [buktiModal, setBuktiModal] = useState<string | null>(null);


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

  useEffect(() => {
    if (selectedRequest && (selectedRequest.status === 'granted' || selectedRequest.status === 'done') && selectedRequest.kendaraan) {
      const fetchLocation = async () => {
        setIsTrackingLoading(true);
        setTrackingError(null);
        try {
          const res = await fetch(`/api/tracking?nopol=${encodeURIComponent(selectedRequest.kendaraan.nopol)}`);
          const data = await res.json();
          if (data.success) {
            setLiveLocation(data.data);
          } else {
            setTrackingError(data.message || 'Gagal melacak kendaraan');
            setLiveLocation(null);
          }
        } catch (error) {
          setTrackingError('Terjadi kesalahan jaringan');
          setLiveLocation(null);
        } finally {
          setIsTrackingLoading(false);
        }
      };

      fetchLocation();
      const interval = setInterval(fetchLocation, 10000); // Auto refresh every 10 seconds
      return () => clearInterval(interval);
    } else {
      setLiveLocation(null);
      setTrackingError(null);
    }
  }, [selectedRequest]);

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
    if (sortField === "tglMulai") {
      const dateA = new Date(a.tglMulai).getTime();
      const dateB = new Date(b.tglMulai).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    } else if (sortField === "createdAt") {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    } else {
      return sortOrder === "desc"
        ? b.noForm.localeCompare(a.noForm)
        : a.noForm.localeCompare(b.noForm);
    }
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(processedRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = processedRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      let endpoint = `/api/requests/${selectedRequest.id}/`;
      let body: any = {};

      if (actionModal === 'delete') {
        endpoint = `/api/requests/${selectedRequest.id}`;
      } else if (actionModal === 'assign') {
        endpoint += 'assign';
        body = { driverId: selectedDriver, kendaraanId: selectedKendaraan, catatan: assignCatatan };
      } else if (actionModal === 'deny') {
        endpoint += 'deny';
        body = { alasanDeny };
      } else if (actionModal === 'done') {
        endpoint += 'done';
      }

      const res = await fetch(endpoint, {
        method: actionModal === 'delete' ? 'DELETE' : 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: actionModal !== 'delete' && Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Tindakan berhasil disimpan");
        setActionModal(null);
        setSelectedRequest(null);
        setAssignCatatan("");
        setAlasanDeny("");
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

  const handleDeleteAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteAllConfirmText !== "HAPUS SEMUA") return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/requests", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Semua histori berhasil dihapus");
        setActionModal(null);
        setDeleteAllConfirmText("");
        fetchData();
      } else {
        toast.error(data.error || "Gagal menghapus data");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsProcessing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = () => {
    const templateData = [{
      "No Form": "",
      "Pemohon": "John Doe",
      "Divisi": "Marketing",
      "Tujuan": "Meeting Klien",
      "Tgl Mulai": "25/08/2026",
      "Jam Mulai": "08:00",
      "Tgl Selesai": "25/08/2026",
      "Jam Selesai": "17:00",
      "Status": "Selesai (Done)",
      "Driver": "Nama Driver (Opsional)",
      "Kendaraan": "Jenis Kendaraan (Opsional)",
      "No. Polisi": "W 1234 XX (Opsional)",
      "Waktu Pengajuan": "24/08/2026 10:00 (Opsional)",
      "Alasan Penolakan": "Opsional, jika status ditolak",
      "Alasan Pembatalan": "Opsional, jika status dibatalkan",
      "Catatan Koor": "Catatan dari koordinator (Opsional)"
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `Template_Import_Transport.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat import");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && (
            <>
              <button
                onClick={() => router.push('/dashboard/live-tracking')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <MapPin className="w-4 h-4" />
                Live Tracking
              </button>
              <button
                onClick={() => router.push('/dashboard/jadwal')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Calendar className="w-4 h-4" />
                Jadwal Pemakaian
              </button>
              <button
                onClick={() => router.push('/dashboard/assets')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <Car className="w-4 h-4" />
                Kendaraan & Driver
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'more-menu' ? null : 'more-menu')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Kelola Data</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'more-menu' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'more-menu' && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700">
                      
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            disabled={isImporting}
                            onClick={() => {
                              setOpenDropdown(null);
                              fileInputRef.current?.click();
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-slate-700">{isImporting ? "Mengimpor..." : "Import Excel"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              handleDownloadTemplate();
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-slate-600">Template Import</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          if (processedRequests.length === 0) {
                            toast.error("Tidak ada data untuk diekspor");
                            return;
                          }
                          const exportData = processedRequests.map(req => ({
                            "No Form": req.noForm,
                            "Pemohon": req.namaPemohon,
                            "Divisi": req.divisi,
                            "Tujuan": req.tujuan,
                            "Tgl Mulai": req.tglMulai ? format(new Date(req.tglMulai), "dd/MM/yyyy") : "",
                            "Jam Mulai": req.tglMulai ? (format(new Date(req.tglMulai), "HH:mm") === "00:00" ? "" : format(new Date(req.tglMulai), "HH:mm")) : "",
                            "Tgl Selesai": req.tglSelesai ? format(new Date(req.tglSelesai), "dd/MM/yyyy") : "",
                            "Jam Selesai": req.tglSelesai ? (format(new Date(req.tglSelesai), "HH:mm") === "00:00" ? "" : format(new Date(req.tglSelesai), "HH:mm")) : "",
                            "Status": statusConfig[req.status]?.label || req.status,
                            "Driver": req.driver ? req.driver.nama : "-",
                            "Kendaraan": req.kendaraan ? req.kendaraan.jenis : "-",
                            "No. Polisi": req.kendaraan ? req.kendaraan.nopol : "-",
                            "Waktu Pengajuan": format(new Date(req.createdAt), "dd/MM/yyyy HH:mm"),
                            "Catatan Koor": req.history?.find((h: any) => h.status === 'granted')?.catatan || ""
                          }));
                          const worksheet = XLSX.utils.json_to_sheet(exportData);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, "Data Transport");
                          XLSX.writeFile(workbook, `Data_Transport_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
                          toast.success("Data berhasil diekspor ke Excel");
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-700">Export Excel</span>
                      </button>

                      {!readOnly && (
                        <>
                          <div className="border-t border-slate-100"></div>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              setDeleteAllConfirmText("");
                              setActionModal('delete-all');
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-bold">Hapus Semua</span>
                          </button>
                        </>
                      )}

                    </div>
                  </>
                )}
              </div>

              {!readOnly && (
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImport}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Total Form</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none truncate">{statTotal}</p>
          </div>
        </div>
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-amber-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Menunggu</p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 leading-none truncate">{statPending}</p>
          </div>
        </div>
        <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-blue-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Disetujui</p>
            <p className="text-xl sm:text-2xl font-black text-blue-700 leading-none truncate">{statGranted}</p>
          </div>
        </div>
        <div className="bg-green-50/80 p-4 rounded-2xl border border-green-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-green-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Selesai</p>
            <p className="text-xl sm:text-2xl font-black text-green-700 leading-none truncate">{statDone}</p>
          </div>
        </div>
        <div className="bg-red-50/80 p-4 rounded-2xl border border-red-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-red-100 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-red-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Ditolak</p>
            <p className="text-xl sm:text-2xl font-black text-red-700 leading-none truncate">{statDeny}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow group">
          <div className="flex-shrink-0 p-2.5 bg-slate-200 text-slate-600 rounded-xl group-hover:scale-110 transition-transform">
            <Ban className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1">Dibatalkan</p>
            <p className="text-xl sm:text-2xl font-black text-slate-700 leading-none truncate">{statCancelled}</p>
          </div>
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
            {(search || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Reset Filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
                  <th className="p-5 pl-6 align-middle">
                    <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => { if (sortField === 'noForm') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); else { setSortField('noForm'); setSortOrder('desc'); } }}>
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">No Form</span>
                      {sortField === 'noForm' ? (
                        <span className="text-indigo-200 bg-indigo-900/50 rounded-md px-1.5 py-0.5 text-xs group-hover:bg-indigo-800 group-hover:text-white transition-colors font-bold">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      ) : (
                        <span className="text-indigo-400/50 px-1.5 py-0.5 text-xs group-hover:text-indigo-200 transition-colors font-bold">
                          ↕
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-5 align-middle">
                    <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => { if (sortField === 'createdAt') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); else { setSortField('createdAt'); setSortOrder('desc'); } }}>
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Waktu Pengajuan</span>
                      {sortField === 'createdAt' ? (
                        <span className="text-indigo-200 bg-indigo-900/50 rounded-md px-1.5 py-0.5 text-xs group-hover:bg-indigo-800 group-hover:text-white transition-colors font-bold">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      ) : (
                        <span className="text-indigo-400/50 px-1.5 py-0.5 text-xs group-hover:text-indigo-200 transition-colors font-bold">
                          ↕
                        </span>
                      )}
                    </div>
                  </th>
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
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-64 overscroll-contain font-normal text-slate-700 capitalize">
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
                    <div className="flex items-center gap-2 cursor-pointer group w-max" onClick={() => { if (sortField === 'tglMulai') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); else { setSortField('tglMulai'); setSortOrder('desc'); } }}>
                      <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Jadwal</span>
                      {sortField === 'tglMulai' ? (
                        <span className="text-indigo-200 bg-indigo-900/50 rounded-md px-1.5 py-0.5 text-xs group-hover:bg-indigo-800 group-hover:text-white transition-colors font-bold">
                          {sortOrder === 'desc' ? '↓' : '↑'}
                        </span>
                      ) : (
                        <span className="text-indigo-400/50 px-1.5 py-0.5 text-xs group-hover:text-indigo-200 transition-colors font-bold">
                          ↕
                        </span>
                      )}
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
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-64 overscroll-contain font-normal text-slate-700 capitalize">
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
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-64 overscroll-contain font-normal text-slate-700 capitalize">
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
                          <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-64 overscroll-contain font-normal text-slate-700 capitalize">
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
                    <td colSpan={10} className="p-10 text-center text-slate-500 bg-white">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-700">Tidak ada permintaan</h3>
                    </td>
                  </tr>
                ) : paginatedRequests.map(req => {
                  const status = statusConfig[req.status];
                  return (
                    <tr key={req.id} className="even:bg-slate-50 odd:bg-white hover:bg-slate-100 transition-colors">
                      <td className="p-5 pl-6 font-bold text-slate-900">{req.noForm}</td>
                      <td className="p-5">
                        <p className="text-sm text-slate-600 font-medium">{formatDateTime(req.createdAt)}</p>
                      </td>
                      <td className="p-5">
                        <p className="font-semibold text-slate-800">{req.namaPemohon}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-600">{req.divisi}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-800 font-medium">{formatDateTime(req.tglMulai)}</p>
                        <p className="text-xs text-slate-500">s/d {formatDateTime(req.tglSelesai)}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-sm text-slate-700 line-clamp-2 max-w-[200px]" title={req.tujuan}>{req.tujuan}</p>
                      </td>
                      <td className="p-5">
                        {req.buktiFileUrl ? (
                          <button
                            onClick={() => setBuktiModal(req.buktiFileUrl)}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium focus:outline-none"
                          >
                            <FileText className="w-4 h-4" /> Lihat
                          </button>
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
                          {(req.status === 'granted' || req.status === 'done') && (
                            (() => {
                              const koorCatatan = req.history?.find((h: any) => h.status === 'granted')?.catatan;
                              if (koorCatatan && koorCatatan !== "Driver dan kendaraan di-assign" && koorCatatan !== "Diimpor dari Excel") {
                                return (
                                  <span className="text-[10px] text-indigo-600 max-w-[140px] line-clamp-2 whitespace-normal break-words mt-1" title={koorCatatan}>
                                    <span className="font-semibold text-indigo-700">Koor:</span> {koorCatatan}
                                  </span>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      </td>
                      <td className="p-5 pr-6 text-right space-x-2 min-w-[200px]">
                        <button
                          title="Detail"
                          onClick={async () => {
                            const res = await fetch(`/api/requests/${req.id}`);
                            const data = await res.json();
                            if (data.success) setSelectedRequest(data.data);
                          }}
                          className="p-2 bg-white text-slate-600 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm inline-flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!readOnly && req.status === 'pending' && (
                          <>
                            <button
                              title="Setujui"
                              onClick={() => { 
                                setSelectedRequest(req); 
                                setSelectedDriver(""); 
                                setSelectedKendaraan(""); 
                                setAssignCatatan("");
                                setActionModal('assign'); 
                              }}
                              className="p-2 bg-green-50 text-green-600 font-semibold border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              title="Tolak"
                              onClick={() => { setSelectedRequest(req); setActionModal('deny'); }}
                              className="p-2 bg-red-50 text-red-600 font-semibold border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!readOnly && req.status === 'granted' && (
                          <>
                            <button
                              title="Tukar Driver/Kendaraan"
                              onClick={() => { 
                                setSelectedRequest(req); 
                                setSelectedDriver(req.driver?.id?.toString() || ""); 
                                setSelectedKendaraan(req.kendaraan?.id?.toString() || ""); 
                                setAssignCatatan("");
                                setActionModal('assign'); 
                              }}
                              className="p-2 bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              title="Selesai"
                              onClick={() => { setSelectedRequest(req); setActionModal('done'); }}
                              className="p-2 bg-green-50 text-green-600 font-semibold border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition-colors shadow-sm inline-flex items-center justify-center"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!readOnly && (
                          <button
                            title="Hapus"
                            onClick={() => { setSelectedRequest(req); setActionModal('delete'); }}
                            className="p-2 bg-slate-50 text-red-600 font-semibold border border-slate-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Menampilkan <span className="font-semibold text-slate-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, processedRequests.length)}</span> dari <span className="font-semibold text-slate-700">{processedRequests.length}</span> data
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Sebelumnnya
                </button>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
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
                    {formatDateTime(selectedRequest.tglMulai)} <span className="text-slate-400 font-normal mx-2">s/d</span> {formatDateTime(selectedRequest.tglSelesai)}
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

              {(selectedRequest.status === 'granted' || selectedRequest.status === 'done') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Live Tracking Position</span>
                    {isTrackingLoading && <span className="text-xs font-normal text-slate-400 flex items-center"><Clock className="w-3 h-3 mr-1 animate-spin" /> Mengambil lokasi...</span>}
                    {liveLocation && <span className="text-xs font-normal text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Realtime - {liveLocation.speed}</span>}
                  </h3>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 min-h-[300px] h-[300px] relative overflow-hidden">
                    {trackingError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center z-10 bg-slate-50">
                        <AlertCircle className="w-12 h-12 mb-3 opacity-20 text-red-500" />
                        <p className="font-semibold text-red-500">{trackingError}</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-0">
                        <DynamicMap location={liveLocation ? { lat: liveLocation.latitude, lng: liveLocation.longitude } : null} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Riwayat</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {selectedRequest.history?.map((hist: any) => {
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

      {/* Modal Aksi */}
      {actionModal && actionModal !== 'delete-all' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {actionModal === 'assign' ? (selectedRequest?.status === 'granted' ? 'Tukar Penugasan' : 'Setujui & Tugaskan') : actionModal === 'deny' ? 'Tolak Permintaan' : actionModal === 'delete' ? 'Hapus Permintaan' : 'Tandai Selesai'}
            </h3>

            <form onSubmit={handleAction}>
              {actionModal === 'assign' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Driver</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'action-driver' ? null : 'action-driver')}
                        className="flex justify-between items-center w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50 text-left"
                      >
                        <span className={selectedDriver ? "text-slate-900" : "text-slate-500"}>
                          {selectedDriver ? (
                            (() => {
                              const d = drivers.find(d => d.id.toString() === selectedDriver);
                              return d ? d.nama : "-- Pilih Driver --";
                            })()
                          ) : "-- Pilih Driver --"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                      {openDropdown === 'action-driver' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-[380px] overscroll-contain font-normal text-slate-700">
                            <button
                              type="button"
                              onClick={() => { setSelectedDriver(""); setOpenDropdown(null); }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100 text-slate-500"
                            >
                              -- Pilih Driver --
                            </button>
                            {availableDrivers.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => { setSelectedDriver(d.id.toString()); setOpenDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${selectedDriver === d.id.toString() ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                              >
                                {d.nama}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      <input type="text" required value={selectedDriver} onChange={() => { }} className="opacity-0 absolute inset-0 -z-10 w-full h-full pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kendaraan</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'action-kendaraan' ? null : 'action-kendaraan')}
                        className="flex justify-between items-center w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 bg-slate-50 text-left"
                      >
                        <span className={selectedKendaraan ? "text-slate-900" : "text-slate-500"}>
                          {selectedKendaraan ? (
                            (() => {
                              const k = kendaraan.find(k => k.id.toString() === selectedKendaraan);
                              return k ? `${k.jenis} - ${k.nopol}` : "-- Pilih Kendaraan --";
                            })()
                          ) : "-- Pilih Kendaraan --"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                      {openDropdown === 'action-kendaraan' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-y-auto overflow-x-hidden max-h-[380px] overscroll-contain font-normal text-slate-700">
                            <button
                              type="button"
                              onClick={() => { setSelectedKendaraan(""); setOpenDropdown(null); }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-slate-100 text-slate-500"
                            >
                              -- Pilih Kendaraan --
                            </button>
                            {availableKendaraan.map(k => (
                              <button
                                key={k.id}
                                type="button"
                                onClick={() => { setSelectedKendaraan(k.id.toString()); setOpenDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${selectedKendaraan === k.id.toString() ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                              >
                                {k.jenis} - {k.nopol}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      <input type="text" required value={selectedKendaraan} onChange={() => { }} className="opacity-0 absolute inset-0 -z-10 w-full h-full pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Catatan (Opsional)</label>
                    <textarea
                      rows={2}
                      value={assignCatatan}
                      onChange={(e) => setAssignCatatan(e.target.value)}
                      placeholder="Masukkan catatan tambahan..."
                      className="block w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                    />
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
                  onClick={() => { setActionModal(null); setSelectedRequest(null); }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-6 py-2 text-white font-bold rounded-full transition-colors disabled:opacity-50 ${actionModal === 'deny' ? 'bg-red-600 hover:bg-red-700' :
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

      {actionModal === 'delete' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hapus Permintaan
              </h3>
              <button onClick={() => setActionModal(null)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus form <span className="font-bold text-slate-800">{selectedRequest.noForm}</span> atas nama <span className="font-bold text-slate-800">{selectedRequest.namaPemohon}</span>?
                <br /><br />
                <span className="text-red-600 font-semibold text-sm">Tindakan ini tidak dapat dibatalkan dan seluruh riwayat akan dihapus.</span>
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAction}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {isProcessing ? "Menghapus..." : "Ya, Hapus Form"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal === 'delete-all' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hapus Semua Histori Permintaan
              </h3>
              <button onClick={() => setActionModal(null)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDeleteAll} className="p-6">
              <p className="text-slate-600 mb-4 leading-relaxed">
                Tindakan ini akan <span className="font-bold text-red-600">MENGHAPUS SEMUA DATA</span> permintaan transportasi dan historinya secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ketik <span className="text-red-600 bg-red-50 px-1 py-0.5 rounded select-all font-mono">HAPUS SEMUA</span> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={deleteAllConfirmText}
                  onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                  placeholder="HAPUS SEMUA"
                  className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-600 bg-red-50/30 text-slate-900 font-bold"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || deleteAllConfirmText !== "HAPUS SEMUA"}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {isProcessing ? "Menghapus..." : "Saya mengerti, hapus semua"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bukti */}
      {buktiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setBuktiModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Bukti File
              </h3>
              <div className="flex items-center gap-3">
                <a href={buktiModal} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                  Buka Tab Baru
                </a>
                <button onClick={() => setBuktiModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-200 p-1.5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100/50 overflow-hidden relative flex items-center justify-center p-6">
              {buktiModal.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || buktiModal.startsWith("data:image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={buktiModal}
                  alt="Bukti File"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm bg-white"
                />
              ) : (
                <iframe
                  src={buktiModal}
                  className="w-full h-full border-0 bg-white rounded-lg shadow-sm"
                  title="Bukti File"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
