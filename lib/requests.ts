import { prisma } from "./prisma";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { RequestStatus } from "@prisma/client";

const TIMEZONE = "Asia/Jakarta";

export async function generateNoForm(tx?: any) {
  const db = tx || prisma;
  const now = toZonedTime(new Date(), TIMEZONE);
  const monthStr = String(now.getMonth() + 1).padStart(3, '0');
  const prefix = `AZM-FRM-405-005-${monthStr}`;
  
  // Find the last request for this month
  const lastRequest = await db.request.findFirst({
    where: {
      noForm: {
        startsWith: prefix
      }
    },
    orderBy: {
      noForm: 'desc'
    }
  });

  const lastRoutineRequest = await db.routineRequest.findFirst({
    where: {
      noForm: {
        startsWith: prefix
      }
    },
    orderBy: {
      noForm: 'desc'
    }
  });

  let maxSequence = 0;

  if (lastRequest && lastRequest.noForm) {
    const parts = lastRequest.noForm.split('-');
    const seqStr = parts[5];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
  }

  if (lastRoutineRequest && lastRoutineRequest.noForm) {
    const parts = lastRoutineRequest.noForm.split('-');
    const seqStr = parts[5];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
  }

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(3, '0');
  return `${prefix}-${sequenceStr}`;
}

export type CreateRequestData = {
  namaPemohon: string;
  divisi: string;
  titikJemput?: string;
  tujuan: string;
  alasan?: string;
  tglMulai: Date;
  tglSelesai: Date;
  buktiFileUrl?: string;
};

export async function createNewRequest(data: CreateRequestData) {
  return await prisma.$transaction(async (tx) => {
    const noForm = await generateNoForm();
    
    const request = await tx.request.create({
      data: {
        noForm,
        namaPemohon: data.namaPemohon,
        divisi: data.divisi,
        titikJemput: data.titikJemput || null,
        tujuan: data.tujuan,
        alasan: data.alasan || null,
        tglMulai: data.tglMulai,
        tglSelesai: data.tglSelesai,
        buktiFileUrl: data.buktiFileUrl,
        status: RequestStatus.pending,
        history: {
          create: {
            status: RequestStatus.pending,
            catatan: "Permintaan diajukan",
          }
        }
      }
    });
    
    return request;
  });
}

export async function getAllRequests(search?: string, status?: RequestStatus, isCalendar: boolean = false) {
  return await prisma.request.findMany({
    where: {
      // Exclude child requests dari routine jika bukan untuk kalender
      routineRequestId: isCalendar ? undefined : null,
      status: status ? status : undefined,
      OR: search ? [
        { noForm: { contains: search } },
        { namaPemohon: { contains: search } }
      ] : undefined
    },
    include: {
      driver: true,
      kendaraan: true,
      history: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getRequestById(id: number) {
  return await prisma.request.findUnique({
    where: { id },
    include: {
      driver: true,
      kendaraan: true,
      history: {
        include: { staff: true },
        orderBy: { createdAt: 'desc' }
      },
      routineRequest: {
        include: {
          requests: {
            select: { id: true },
            orderBy: { tglMulai: 'asc' }
          }
        }
      }
    }
  });
}

export async function getRequestByNoForm(noForm: string) {
  return await prisma.request.findUnique({
    where: { noForm },
    include: {
      driver: true,
      kendaraan: true,
      history: {
        include: { staff: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function assignRequest(id: number, staffId: number, driverId: number, kendaraanId: number, catatan?: string) {
  return await prisma.$transaction(async (tx) => {
    // Check if driver is assigned to another active request
    const activeStatuses = [RequestStatus.pending, RequestStatus.granted, RequestStatus.waiting_assignment, RequestStatus.assigned, RequestStatus.in_progress];
    const existingDriverReq = await tx.request.findFirst({
      where: { driverId, status: { in: activeStatuses }, id: { not: id } }
    });
    if (existingDriverReq) {
      throw new Error(`Driver sedang ditugaskan di form ${existingDriverReq.noForm}`);
    }

    // Check if kendaraan is assigned to another active request
    const existingKendaraanReq = await tx.request.findFirst({
      where: { kendaraanId, status: { in: activeStatuses }, id: { not: id } }
    });
    if (existingKendaraanReq) {
      throw new Error(`Kendaraan sedang digunakan di form ${existingKendaraanReq.noForm}`);
    }

    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.assigned,
        driverId,
        kendaraanId,
        history: {
          create: {
            status: RequestStatus.assigned,
            staffId,
            catatan: catatan ? catatan : "Driver dan kendaraan di-assign"
          }
        }
      }
    });
    return req;
  });
}

export async function grantRequest(id: number, staffId: number) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.granted,
        history: {
          create: {
            status: RequestStatus.granted,
            staffId,
            catatan: "Permintaan disetujui"
          }
        }
      }
    });
    return req;
  });
}

export async function waitAssignmentRequest(id: number, staffId: number) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.waiting_assignment,
        history: {
          create: {
            status: RequestStatus.waiting_assignment,
            staffId,
            catatan: "Menunggu penugasan driver dan kendaraan"
          }
        }
      }
    });
    return req;
  });
}

export async function startProgressRequest(id: number, staffId: number) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.in_progress,
        history: {
          create: {
            status: RequestStatus.in_progress,
            staffId,
            catatan: "Perjalanan dimulai"
          }
        }
      }
    });
    return req;
  });
}

export async function denyRequest(id: number, staffId: number, alasanDeny: string) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.deny,
        alasanDeny,
        history: {
          create: {
            status: RequestStatus.deny,
            staffId,
            catatan: `Ditolak: ${alasanDeny}`
          }
        }
      }
    });
    return req;
  });
}

export async function finishRequest(id: number, staffId: number) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.done,
        history: {
          create: {
            status: RequestStatus.done,
            staffId,
            catatan: "Permintaan selesai"
          }
        }
      }
    });
    return req;
  });
}

export async function cancelRequest(id: number, alasanCancel: string) {
  return await prisma.$transaction(async (tx) => {
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.cancelled,
        alasanCancel,
        history: {
          create: {
            status: RequestStatus.cancelled,
            catatan: `Dibatalkan oleh pemohon: ${alasanCancel}`
          }
        }
      }
    });
    return req;
  });
}

export async function deleteRequest(id: number) {
  return await prisma.request.delete({
    where: { id }
  });
}
