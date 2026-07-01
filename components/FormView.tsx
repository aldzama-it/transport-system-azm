"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Building, User, FileText, UploadCloud, CarFront, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function FormView({ onSwitchToTracking }: { onSwitchToTracking: (noForm?: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ noForm: string; namaPemohon: string; tujuan: string; tglMulai: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Validate file size manually before sending
    const file = formData.get("buktiFile") as File;
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Permintaan berhasil diajukan!");
        setSuccessData(data.data);
      } else {
        toast.error(data.error || "Gagal mengajukan permintaan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center w-full transform transition-all duration-500 hover:shadow-2xl border border-indigo-50">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CarFront className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Permintaan Terkirim!</h2>
          <p className="text-lg text-slate-600 mb-6">
            Terima kasih, permintaan kendaraan Anda telah kami terima. Harap simpan nomor form berikut untuk melacak status permintaan Anda.
          </p>
          <div className="bg-slate-50 p-6 rounded-xl inline-block border border-slate-200 mb-6 w-full max-w-sm">
            <p className="text-sm text-slate-500 font-medium mb-1">Nomor Form:</p>
            <p className="text-3xl font-black text-indigo-700 tracking-wider">{successData.noForm}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 text-center w-full">
            <p className="text-sm text-green-800 font-medium mb-4">
              Penting! Harap konfirmasi form yang telah diajukan ke WhatsApp Koordinator Transportasi agar bisa segera diproses.
            </p>
            <a 
              href={`https://wa.me/6285732769920?text=${encodeURIComponent(`Halo Koor Transport, saya ingin konfirmasi lebih lanjut mengenai permintaan penggunaan kendaraan dengan nomor form: ${successData.noForm} atas nama ${successData.namaPemohon} dengan tujuan ${successData.tujuan} tanggal ${format(new Date(successData.tglMulai), "dd MMM yyyy")} jam ${format(new Date(successData.tglMulai), "HH:mm")}`)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold hover:bg-[#128C7E] transition-colors w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Konfirmasi via WhatsApp
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setSuccessData(null)} 
              className="px-6 py-3 border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Ajukan Lagi
            </button>
            <button 
              onClick={() => onSwitchToTracking(successData.noForm)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Lacak Sekarang <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Pengajuan Kendaraan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Lebih Mudah</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Isi form di bawah ini untuk Pengajuan penggunaan kendaraan operasional PT ALDZAMA. Cepat, mudah, dan transparan.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all hover:shadow-2xl">
        {/* Placeholder for future car banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-8 left-8 bg-white p-4 rounded-2xl shadow-lg">
            <CarFront className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-12 md:p-12 md:pt-16 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Data Pemohon</h3>
              
              <div>
                <label htmlFor="namaPemohon" className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="namaPemohon"
                    id="namaPemohon"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="divisi" className="block text-sm font-medium text-slate-700 mb-2">
                  Divisi / Departemen
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="divisi"
                    id="divisi"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 hover:bg-white focus:bg-white"
                    placeholder="Contoh: Marketing"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Detail Penggunaan</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tglMulai" className="block text-sm font-medium text-slate-700 mb-2">
                    Tgl & Jam Mulai
                  </label>
                  <input
                    type="datetime-local"
                    name="tglMulai"
                    id="tglMulai"
                    required
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="tglSelesai" className="block text-sm font-medium text-slate-700 mb-2">
                    Tgl & Jam Selesai
                  </label>
                  <input
                    type="datetime-local"
                    name="tglSelesai"
                    id="tglSelesai"
                    required
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-slate-50 text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tujuan" className="block text-sm font-medium text-slate-700 mb-2">
                  Tujuan Penggunaan
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea
                    name="tujuan"
                    id="tujuan"
                    required
                    rows={3}
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
              {isSubmitting ? "Mengirim..." : "Ajukan Permintaan Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
