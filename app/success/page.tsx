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
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-10 text-center w-full border border-slate-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-100 mb-4 sm:mb-6 shrink-0">
          <CarFront className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">{isRoutine ? "Pengajuan Rutin Terkirim!" : "Permintaan Terkirim!"}</h2>
        <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          Terima kasih, pengajuan kendaraan Anda telah kami terima. Harap simpan nomor form berikut untuk referensi dan pelacakan status.
        </p>

        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200/80 mb-6 w-full max-w-md mx-auto text-center shadow-inner">
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">{isRoutine ? "Nomor Form (Rutin)" : "Nomor Form"}</p>
          <div className="mb-4">
            <span className="text-xs sm:text-base md:text-lg font-black text-indigo-700 tracking-tight whitespace-nowrap bg-indigo-50/90 py-2 px-3 sm:px-4 rounded-xl border border-indigo-100/80 select-all inline-block max-w-full overflow-x-auto font-sans">
              {noForm}
            </span>
          </div>

          {isRoutine ? (
            <>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mb-1 uppercase tracking-wider">Periode Rutin</p>
              <p className="text-sm sm:text-base font-bold text-slate-800">
                {format(new Date(data.startDate), "dd MMM yyyy")} - {format(new Date(data.endDate), "dd MMM yyyy")}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mb-1 uppercase tracking-wider">Tanggal Penggunaan</p>
              <p className="text-sm sm:text-base font-bold text-slate-800">
                {format(new Date(data.tglMulai), "dd MMM yyyy HH:mm")}
              </p>
            </>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-center w-full max-w-md mx-auto">
          <p className="text-xs sm:text-sm text-emerald-900 font-medium mb-3 leading-relaxed">
            Penting! Harap konfirmasi form yang telah diajukan ke WhatsApp Koordinator Transportasi agar bisa segera diproses.
          </p>
          <a
            href={`https://wa.me/6285732769920?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-colors w-full shadow-sm hover:shadow-md text-sm sm:text-base min-h-[44px]"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            Konfirmasi via WhatsApp
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Link
            href={isRoutine ? "/request/routine" : "/"}
            className="w-full sm:w-1/2 px-5 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2 text-sm min-h-[44px]"
          >
             Ajukan Lagi
          </Link>
          <Link
            href={`/lacak?noForm=${noForm}`}
            className="w-full sm:w-1/2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm min-h-[44px]"
          >
            Lacak Sekarang <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
