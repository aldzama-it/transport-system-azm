"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building, User, FileText, UploadCloud, CarFront, ArrowRight, MessageCircle, Clock, Repeat, MapPin, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

const DIVISIONS = [
  "Business Development",
  "Trading",
  "Marketing Communication",
  "Engineering",
  "PTS - Manpower Supply",
  "Freeport - Refractory Routine Maintenance",
  "Freeport - Manpower Supply Hot Metal",
  "Freeport - Tapper Skimmer",
  "Freeport - Scaffolding Supply & Install",
  "Freeport - Lime Package & ETP",
  "Freeport - Matte Grinding Maintenance Service",
  "Freeport - Excavator & Dump Truck Rental",
  "Freeport - Vacuum Truck",
  "Vale - Ladle Cleaning",
  "Vale - Forklift Ladle Handler 25 Ton",
  "Antam - Refractory Lining, Slag Pot Demolition Robot",
  "Antam - Vacuum Truck",
  "Antam - Fabrikasi Electrode Casing",
  "PT Ceria - Refractory Ladle Maintenance",
  "Project Control",
  "HSE",
  "Projects",
  "Fabrication & Hydraulic",
  "Asset Maintenance",
  "Transport",
  "Procurement",
  "Warehouse",
  "External Relation",
  "Export & Import",
  "Finance",
  "HRD",
  "QMS",
  "Legal",
  "IT",
  "Office Support"
];

export default function RoutineRequestClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [divisiInput, setDivisiInput] = useState("");
  const [showDivisiDropdown, setShowDivisiDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    requester: "",
    project: "",
    pickup: "",
    destination: "",
    startDate: "",
    endDate: "",
    departureTime: "08:00",
    returnTime: "17:00",
    repeatType: "weekdays",
    notes: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!selectedFile) {
      toast.error("File persetujuan wajib diupload");
      setIsSubmitting(false);
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      setIsSubmitting(false);
      return;
    }
    
    const submitData = new FormData();
    submitData.append("title", formData.notes || formData.destination);
    submitData.append("requester", formData.requester);
    submitData.append("divisi", divisiInput);
    if (formData.project) submitData.append("project", formData.project);
    if (formData.pickup) submitData.append("pickup", formData.pickup);
    submitData.append("destination", formData.destination);
    submitData.append("startDate", formData.startDate);
    submitData.append("endDate", formData.endDate);
    submitData.append("departureTime", formData.departureTime);
    submitData.append("returnTime", formData.returnTime);
    submitData.append("repeatType", formData.repeatType);
    if (formData.notes) submitData.append("notes", formData.notes);
    submitData.append("file", selectedFile);
    
    try {
      const res = await fetch("/api/routine-requests", {
        method: "POST",
        body: submitData
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Jadwal rutin berhasil diajukan!");
        router.push(`/success?noForm=${data.data.noForm}&type=routine`);
      } else {
        toast.error(data.error || "Gagal mengajukan jadwal rutin");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Pengajuan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Jadwal Rutin</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Isi form di bawah ini untuk mengajukan penggunaan kendaraan rutin secara otomatis tanpa perlu mengisi form setiap hari.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all hover:shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-8 left-8 bg-white p-4 rounded-2xl shadow-lg">
            <Repeat className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-12 md:p-12 md:pt-16 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* DATA PEMOHON */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Data Pemohon & Jadwal</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="requester"
                    required
                    value={formData.requester}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Divisi / Departemen</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-30">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={divisiInput}
                    onChange={(e) => {
                      setDivisiInput(e.target.value);
                      setShowDivisiDropdown(true);
                    }}
                    onFocus={() => setShowDivisiDropdown(true)}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white relative z-20"
                    placeholder="Pilih atau ketik divisi..."
                    autoComplete="off"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowDivisiDropdown(!showDivisiDropdown)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-30 focus:outline-none"
                  >
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${showDivisiDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showDivisiDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowDivisiDropdown(false)} />
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto overscroll-contain">
                        {DIVISIONS.filter(d => d.toLowerCase().includes(divisiInput.toLowerCase())).map((div, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setDivisiInput(div);
                              setShowDivisiDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors border-b border-slate-50 last:border-0 text-sm"
                          >
                            {div}
                          </button>
                        ))}
                        {divisiInput && !DIVISIONS.some(d => d.toLowerCase() === divisiInput.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => setShowDivisiDropdown(false)}
                            className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 font-bold border-t border-slate-100 text-sm"
                          >
                            Gunakan "{divisiInput}"
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* DETAIL RUTINITAS */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Detail Rute & Waktu</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titik Jemput</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="pickup"
                      required
                      value={formData.pickup}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white"
                      placeholder="Lokasi penjemputan awal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titik Tujuan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="destination"
                      required
                      value={formData.destination}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white"
                      placeholder="Lokasi tujuan akhir"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Periode Jadwal</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="block w-1/2 px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                  />
                  <span className="text-slate-400 font-medium">s/d</span>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleChange}
                    className="block w-1/2 px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jam Operasional Harian</label>
                <div className="flex gap-2">
                  <div className="w-1/2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="time"
                      name="departureTime"
                      required
                      value={formData.departureTime}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                    />
                  </div>
                  <div className="w-1/2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="time"
                      name="returnTime"
                      required
                      value={formData.returnTime}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Pengulangan</label>
                <select 
                  name="repeatType"
                  value={formData.repeatType} 
                  onChange={handleChange} 
                  className="block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700"
                >
                  <option value="daily">Setiap Hari (Senin - Minggu)</option>
                  <option value="weekdays">Hari Kerja (Senin - Jumat)</option>
                  <option value="weekly">Mingguan (Sesuai hari mulai)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tujuan Penggunaan</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    name="notes"
                    rows={3}
                    required
                    value={formData.notes}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white resize-none"
                    placeholder="Jelaskan tujuan pemakaian..."
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Dokumen Pendukung</h3>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all bg-slate-50 group cursor-pointer relative overflow-hidden">
              <div className="space-y-2 text-center relative z-10">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="buktiFile" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none px-2 py-1 shadow-sm border border-slate-200 transition-colors">
                    <span>{selectedFile ? 'Ganti file' : 'Pilih file persetujuan'}</span>
                    <input id="buktiFile" name="buktiFile" type="file" className="sr-only" required accept="image/*,.pdf" onChange={handleFileChange} />
                  </label>
                </div>
                {selectedFile ? (
                  <p className="text-sm font-semibold text-indigo-700">{selectedFile.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">PDF atau Gambar (Maks. 10MB)</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              {isSubmitting ? "Mengirim Jadwal..." : "Ajukan Jadwal Rutin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
