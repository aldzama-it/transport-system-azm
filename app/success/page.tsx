import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CarFront, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ noForm?: string; type?: string }> }) {
  const params = await searchParams;
  const noForm = params?.noForm;
  const type = params?.type;

  if (!noForm) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-xl text-slate-600">Nomor Form tidak ditemukan.</p>
        <Link href="/" className="mt-4 text-indigo-600 hover:underline inline-block">Kembali ke Beranda</Link>
      </div>
    );
  }

  let data: any = null;

  if (type === "routine") {
    data = await prisma.routineRequest.findUnique({
      where: { noForm }
    });
  } else {
    data = await prisma.request.findUnique({
      where: { noForm }
    });
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-xl text-slate-600">Data permintaan tidak ditemukan atau belum disetujui.</p>
        <Link href="/" className="mt-4 text-indigo-600 hover:underline inline-block">Kembali ke Beranda</Link>
      </div>
    );
  }

  const isRoutine = type === "routine";

  // WhatsApp Message Logic
  let waText = "";
  if (isRoutine) {
    waText = `Halo Koor Transport, saya ingin konfirmasi mengenai permintaan Jadwal Rutin dengan Nomor Form: ${noForm} atas nama ${data.requester} untuk divisi ${data.divisi} dengan tujuan penggunaan: ${data.notes || data.title}. Mohon dapat segera diproses.`;
  } else {
    waText = `Halo Koor Transport, saya ingin konfirmasi lebih lanjut mengenai permintaan penggunaan kendaraan dengan nomor form: ${noForm} atas nama ${data.namaPemohon}${data.titikJemput ? ` dengan titik jemput ${data.titikJemput}` : ''} menuju ${data.tujuan} tanggal ${format(new Date(data.tglMulai), "dd MMM yyyy")} jam ${format(new Date(data.tglMulai), "HH:mm")}`;
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center w-full transform transition-all duration-500 hover:shadow-2xl border border-indigo-50">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CarFront className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{isRoutine ? "Pengajuan Rutin Terkirim!" : "Permintaan Terkirim!"}</h2>
        <p className="text-lg text-slate-600 mb-6">
          Terima kasih, pengajuan kendaraan Anda telah kami terima. Harap simpan nomor form berikut untuk referensi dan pelacakan status.
        </p>

        <div className="bg-slate-50 p-6 rounded-xl inline-block border border-slate-200 mb-6 w-full sm:w-auto min-w-[20rem] text-left">
          <p className="text-sm text-slate-500 font-medium mb-1">{isRoutine ? "Nomor Form (Rutin):" : "Nomor Form:"}</p>
          <p className="text-base sm:text-xl md:text-2xl font-black text-indigo-700 tracking-widest mb-4 whitespace-nowrap">{noForm}</p>

          {isRoutine ? (
            <>
              <p className="text-sm text-slate-500 font-medium mb-1">Periode Rutin:</p>
              <p className="text-md font-semibold text-slate-800">
                {format(new Date(data.startDate), "dd MMM yyyy")} - {format(new Date(data.endDate), "dd MMM yyyy")}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 font-medium mb-1">Tanggal Penggunaan:</p>
              <p className="text-md font-semibold text-slate-800">
                {format(new Date(data.tglMulai), "dd MMM yyyy HH:mm")}
              </p>
            </>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8 text-center w-full">
          <p className="text-sm text-green-800 font-medium mb-4">
            Penting! Harap konfirmasi form yang telah diajukan ke WhatsApp Koordinator Transportasi agar bisa segera diproses.
          </p>
          <a
            href={`https://wa.me/6285732769920?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold hover:bg-[#128C7E] transition-colors w-full sm:w-auto shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-5 h-5" />
            Konfirmasi via WhatsApp
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={isRoutine ? "/request/routine" : "/"}
            className="px-6 py-3 border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
          >
             Ajukan Lagi
          </Link>
          <Link
            href={`/?tab=track&noForm=${noForm}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            Lacak Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
