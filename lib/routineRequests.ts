import { prisma } from "./prisma";
import { generateNoForm } from "./requests";
import { RoutineStatus, RequestStatus } from "@prisma/client";
import { addDays, isWeekend, startOfDay, isBefore, isAfter, isSameDay, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Jakarta";

export type CreateRoutineRequestData = {
  title: string;
  requester: string;
  divisi: string;
  project?: string;
  pickup?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  departureTime: string;
  returnTime: string;
  repeatType: string;
  notes?: string;
  buktiFileUrl?: string;
};

export async function createRoutineRequest(data: CreateRoutineRequestData) {
  return await prisma.$transaction(async (tx) => {
    const noForm = await generateNoForm(tx);

    return await tx.routineRequest.create({
      data: {
        ...data,
        noForm,
        status: RoutineStatus.pending,
      }
    });
  });
}

export async function getAllRoutineRequests() {
  return await prisma.routineRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      requests: {
        select: { status: true }
      },
      _count: {
        select: { requests: true }
      }
    }
  });
}

export async function getRoutineRequestById(id: number) {
  return await prisma.routineRequest.findUnique({
    where: { id },
    include: {
      requests: {
        include: {
          driver: true,
          kendaraan: true,
          history: true
        },
        orderBy: {
          tglMulai: 'asc'
        }
      }
    }
  });
}

export function calculateExpectedDays(startDate: Date, endDate: Date, repeatType: string): number {
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));

  let currentDate = start;
  let count = 0;

  while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
    let shouldAdd = false;
    if (repeatType === 'daily') {
      shouldAdd = true;
    } else if (repeatType === 'weekdays') {
      shouldAdd = !isWeekend(currentDate);
    } else if (repeatType === 'weekly') {
      if (currentDate.getDay() === start.getDay()) {
        shouldAdd = true;
      }
    }
    if (shouldAdd) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }
  return count;
}

function getAlphabetSuffix(index: number): string {
  let suffix = '';
  let i = index;
  while (i >= 0) {
    suffix = String.fromCharCode(97 + (i % 26)) + suffix;
    i = Math.floor(i / 26) - 1;
  }
  return suffix;
}

export function generatePreviewChildRequests(routine: any) {
  const start = startOfDay(new Date(routine.startDate));
  const end = startOfDay(new Date(routine.endDate));

  let currentDate = start;
  const mockRequests = [];
  let index = 1;

  while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
    let shouldAdd = false;
    if (routine.repeatType === 'daily') {
      shouldAdd = true;
    } else if (routine.repeatType === 'weekdays') {
      shouldAdd = !isWeekend(currentDate);
    } else if (routine.repeatType === 'weekly') {
      if (currentDate.getDay() === start.getDay()) {
        shouldAdd = true;
      }
    }

    if (shouldAdd) {
      const date = new Date(currentDate);
      const [depHours, depMinutes] = routine.departureTime.split(':').map(Number);
      const [retHours, retMinutes] = routine.returnTime.split(':').map(Number);

      const tglMulai = new Date(date);
      tglMulai.setHours(depHours, depMinutes, 0, 0);

      const tglSelesai = new Date(date);
      tglSelesai.setHours(retHours, retMinutes, 0, 0);

      mockRequests.push({
        id: -index, // negative ID to indicate preview
        noForm: routine.noForm ? `${routine.noForm}${getAlphabetSuffix(index - 1)}` : `Draft-${getAlphabetSuffix(index - 1)}`,
        namaPemohon: routine.requester,
        divisi: routine.divisi,
        tujuan: routine.destination,
        tglMulai,
        tglSelesai,
        status: "pending",
        isPreview: true, // Custom flag
      });
      index++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return mockRequests;
}

export async function generateChildRequests(routineId: number, staffId: number) {
  return await prisma.$transaction(async (tx) => {
    const routine = await tx.routineRequest.findUnique({ where: { id: routineId } });
    if (!routine) throw new Error("Routine request not found");

    const start = startOfDay(new Date(routine.startDate));
    const end = startOfDay(new Date(routine.endDate));

    let currentDate = start;
    const datesToGenerate: Date[] = [];

    while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
      let shouldAdd = false;

      if (routine.repeatType === 'daily') {
        shouldAdd = true;
      } else if (routine.repeatType === 'weekdays') {
        shouldAdd = !isWeekend(currentDate);
      } else if (routine.repeatType === 'weekly') {
        if (currentDate.getDay() === start.getDay()) {
          shouldAdd = true;
        }
      }

      if (shouldAdd) {
        datesToGenerate.push(new Date(currentDate));
      }

      currentDate = addDays(currentDate, 1);
    }

    if (datesToGenerate.length === 0) {
      throw new Error("No matching dates found for the specified range and repeat type");
    }

    const createdRequests = [];
    let childIndex = 0;

    for (const date of datesToGenerate) {
      const noForm = `${routine.noForm}${getAlphabetSuffix(childIndex)}`;
      childIndex++;

      // Parse departure and return times to create Date objects
      const [depHours, depMinutes] = routine.departureTime.split(':').map(Number);
      const [retHours, retMinutes] = routine.returnTime.split(':').map(Number);

      const tglMulai = new Date(date);
      tglMulai.setHours(depHours, depMinutes, 0, 0);

      const tglSelesai = new Date(date);
      tglSelesai.setHours(retHours, retMinutes, 0, 0);

      const request = await tx.request.create({
        data: {
          noForm,
          namaPemohon: routine.requester,
          divisi: routine.divisi,
          tujuan: routine.destination,
          tglMulai,
          tglSelesai,
          buktiFileUrl: routine.buktiFileUrl,
          status: RequestStatus.granted,
          routineRequestId: routine.id,
          history: {
            createMany: {
              data: [
                {
                  status: RequestStatus.pending,
                  staffId,
                  catatan: `Dihasilkan otomatis dari Routine Request: ${routine.title}`
                },
                {
                  status: RequestStatus.granted,
                  staffId,
                  catatan: `Disetujui otomatis bersama Routine Request: ${routine.noForm}`
                }
              ]
            }
          }
        }
      });
      createdRequests.push(request);
    }

    await tx.routineRequest.update({
      where: { id: routineId },
      data: { status: RoutineStatus.active }
    });

    return createdRequests;
  });
}

export async function deleteRoutineRequest(id: number) {
  // Cascading deletes on Request are not enabled by default,
  // so we might need to delete related requests first, or just leave them.
  // We will just cancel them for now.
  return await prisma.$transaction(async (tx) => {
    await tx.request.updateMany({
      where: { routineRequestId: id, status: { in: [RequestStatus.pending, RequestStatus.granted, RequestStatus.waiting_assignment] } },
      data: { status: RequestStatus.cancelled, alasanCancel: 'Routine request deleted' }
    });

    return await tx.routineRequest.delete({
      where: { id }
    });
  });
}
