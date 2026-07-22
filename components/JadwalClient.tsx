"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Car, UserCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JadwalClient({ readOnly = false }: { readOnly?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const [requests, setRequests] = useState<any[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/requests?type=calendar');
      const reqData = await res.json();

      if (reqData.success) {
        // Ambil jadwal yang sudah disetujui, ditugaskan, sedang berjalan, atau selesai, dan abaikan parent routine
        const activeStatuses = ['granted', 'assigned', 'in_progress', 'done'];
        setRequests(reqData.data.filter((r: any) => !r.isRoutineParent && activeStatuses.includes(r.status)));
      }
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      mulai.setHours(0, 0, 0, 0);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      let selesai = req.tglSelesai ? new Date(req.tglSelesai) : new Date(mulai);
      selesai.setHours(23, 59, 59, 999);

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
          <h1 className="text-3xl font-black text-slate-900">Jadwal Pemakaian</h1>
          <p className="text-slate-500">Pantau jadwal operasional armada transportasi.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat jadwal...</p>
        </div>
      ) : (
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
          {/* Mobile scroll hint */}
          <div className="overflow-x-auto md:overflow-x-visible">
            <div className="min-w-[480px] md:min-w-0">
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
                      className={`min-h-[80px] md:min-h-[140px] p-1.5 md:p-2.5 border-b border-r border-slate-100 transition-colors hover:bg-slate-50/80 group/cell ${!isCurrentMonth ? 'bg-slate-50/40 opacity-50' : 'bg-white'} ${isTodayDate ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/10' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1 md:mb-2.5">
                        <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-transform group-hover/cell:scale-110 ${isTodayDate ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}>
                          {format(day, 'd')}
                        </span>
                        {bookings.length > 0 && (
                          <span className="text-[9px] md:text-[10px] font-black text-indigo-600 bg-indigo-100 px-1 md:px-2 py-0.5 rounded-full">
                            {bookings.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-1.5 overflow-y-auto max-h-[60px] md:max-h-[100px] hide-scrollbar pr-0.5 md:pr-1">
                        {bookings.map((b, idx) => {
                          const colorVariants = [
                            "bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white",
                            "bg-blue-600 border-blue-700 hover:bg-blue-700 text-white",
                            "bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white",
                            "bg-violet-600 border-violet-700 hover:bg-violet-700 text-white"
                          ];
                          const colorClass = colorVariants[idx % colorVariants.length];

                          return (
                            <div key={b.id} className={`text-xs px-1.5 md:px-2.5 py-1 md:py-2 rounded-lg border shadow-sm cursor-default group relative transition-colors ${colorClass}`}>
                              <p className="font-bold truncate text-[9px] md:text-[11px] mb-0.5 flex items-center gap-1">
                                <Car className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 opacity-90 shrink-0" />
                                <span className="hidden md:inline">{b.kendaraan?.jenis || "Belum ada mobil"}</span>
                                <span className="md:hidden">{b.kendaraan?.nopol || "?"}  </span>
                              </p>
                              <p className="font-medium truncate text-[9px] md:text-[10px] flex items-center gap-1 opacity-90 hidden md:flex">
                                <UserCircle className="w-3.5 h-3.5 shrink-0" />
                                {b.driver?.nama || "Tanpa driver"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
