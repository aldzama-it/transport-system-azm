import { prisma } from "./prisma";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { RequestStatus } from "@prisma/client";

const TIMEZONE = "Asia/Jakarta";

export async function generateNoForm() {
  const now = toZonedTime(new Date(), TIMEZONE);
  const monthStr = String(now.getMonth() + 1).padStart(3, '0');
  const prefix = `AZM-FRM-405-005-${monthStr}`;
  
  // Find the last request for this month
  const lastRequest = await prisma.request.findFirst({
    where: {
      noForm: {
        startsWith: prefix
      }
    },
    orderBy: {
      noForm: 'desc'
    }
  });

  let nextSequence = 1;
  if (lastRequest) {
    const parts = lastRequest.noForm.split('-');
    const lastSequenceStr = parts[5];
    const lastSequence = parseInt(lastSequenceStr, 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  const sequenceStr = nextSequence.toString().padStart(3, '0');
  return `${prefix}-${sequenceStr}`;
}

export type CreateRequestData = {
  namaPemohon: string;
  divisi: string;
  tujuan: string;
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
        tujuan: data.tujuan,
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

export async function getAllRequests(search?: string, status?: RequestStatus) {
  return await prisma.request.findMany({
    where: {
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
    const req = await tx.request.update({
      where: { id },
      data: {
        status: RequestStatus.granted,
        driverId,
        kendaraanId,
        history: {
          create: {
            status: RequestStatus.granted,
            staffId,
            catatan: catatan ? catatan : "Driver dan kendaraan di-assign"
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
