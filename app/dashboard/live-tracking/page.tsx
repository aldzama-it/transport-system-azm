"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Car, RefreshCw, Signal, Map as MapIcon, Database, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { DashcamVehicle } from "@/components/FleetMap";

// Map must be dynamically imported to avoid SSR issues with window object
const FleetMap = dynamic(() => import("@/components/FleetMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center text-slate-400">
        <MapIcon className="w-10 h-10 mb-2 animate-bounce" />
        <p className="font-semibold">Memuat Peta...</p>
      </div>
    </div>
  )
});

export default function FleetTrackingPage() {
  const [vehicles, setVehicles] = useState<DashcamVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedVehicleSN, setSelectedVehicleSN] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch dashcam API (using our mock endpoint)
      const resDashcam = await fetch("/api/dashcam");
      const dataDashcam = await resDashcam.json();
      
      // 2. Fetch database vehicles to match license plates
      const resDb = await fetch("/api/kendaraan");
      const dataDb = await resDb.json();
      
      const dbKendaraan = dataDb.data || [];

      // Helper function to normalize text
      const normalizeText = (text: string | null) => {
        if (!text) return "";
        return text.replace(/[^A-Z0-9]/ig, '').toUpperCase();
      };

      // 3. Match the data
      if (dataDashcam.ok && dataDashcam.vehicles) {
        const matchedVehicles = dataDashcam.vehicles.map((v: any) => {
          let normCarName = normalizeText(v.car_name);
          // Patch typo dari sistem dashcam
          if (normCarName.includes('W7306AG')) {
            normCarName = normCarName.replace('W7306AG', 'W7036AG');
          }
          
          const matchedDb = dbKendaraan.find((dbCar: any) => {
            const normNopol = normalizeText(dbCar.nopol);
            if (!normNopol) return false;
            // check if car_name contains the nopol
            return normCarName.includes(normNopol);
          });

          return {
            ...v,
            dbId: matchedDb ? matchedDb.id : undefined,
            nopol: matchedDb ? matchedDb.nopol : undefined
          };
        });

        setVehicles(matchedVehicles);
        setLastUpdated(dataDashcam.last_updated);
      }
    } catch (error) {
      console.error("Failed to fetch fleet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set an interval to refresh data every 60 seconds
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Stats
  const activeVehicles = vehicles.filter(v => v.acc_state === "ON").length;
  const offlineVehicles = vehicles.filter(v => v.acc_state === "OFF").length;
  const withDbMatch = vehicles.filter(v => v.nopol).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Car className="w-8 h-8 text-indigo-600" />
            Live Fleet Tracking
          </h1>
          <p className="text-slate-600 mt-2">
            Pemantauan lokasi kendaraan operasional secara real-time via Dashcam terintegrasi.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Terakhir update: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '-'}
          </p>
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Kendaraan (Dashcam)</p>
            <p className="text-2xl font-black text-slate-900">{vehicles.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            <Signal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Mesin Aktif (ON)</p>
            <p className="text-2xl font-black text-slate-900">{activeVehicles}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <Signal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Mesin Mati (OFF)</p>
            <p className="text-2xl font-black text-slate-900">{offlineVehicles}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Sinkron Database</p>
            <p className="text-2xl font-black text-slate-900">{withDbMatch} <span className="text-sm text-slate-400 font-medium">/ {vehicles.length}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-8 p-1">
        <FleetMap vehicles={vehicles} selectedVehicleSN={selectedVehicleSN} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Daftar Kendaraan Terdeteksi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-bold">Nama / Device</th>
                <th className="px-6 py-4 font-bold">No. Polisi (DB)</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Kecepatan</th>
                <th className="px-6 py-4 font-bold">Koordinat</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, idx) => (
                <tr 
                  key={v.device_sn || idx} 
                  onClick={() => setSelectedVehicleSN(v.device_sn)}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${selectedVehicleSN === v.device_sn ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{v.car_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-1">SN: {v.device_sn}</p>
                  </td>
                  <td className="px-6 py-4">
                    {v.nopol ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {v.nopol}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Belum disinkron</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${v.acc_state === 'ON' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {v.acc_state}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">{v.speed}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {v.latitude !== null ? `${v.latitude}, ${v.longitude}` : 'Tidak ada sinyal GPS'}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                    Belum ada data kendaraan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
