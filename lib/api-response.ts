import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function apiSuccess<T>(data: T, pagination?: ApiResponse<T>["pagination"], status = 200) {
  const responseObj: ApiResponse<T> = {
    success: true,
    data,
  };
  if (pagination) {
    responseObj.pagination = pagination;
  }
  return NextResponse.json(responseObj, { status });
}

export function apiError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function apiValidationError(error: any) {
  let message = "Validasi data gagal";
  const formattedError = typeof error?.flatten === "function" ? error.flatten() : error;
  
  if (formattedError?.fieldErrors) {
    const firstField = Object.keys(formattedError.fieldErrors)[0];
    if (firstField && formattedError.fieldErrors[firstField]?.[0]) {
      message = formattedError.fieldErrors[firstField][0];
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
      details: formattedError,
    },
    { status: 400 }
  );
}

export function apiUnauthorized(message = "Tidak terautentikasi") {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}

export function apiForbidden(message = "Akses ditolak") {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}

export function apiNotFound(message = "Data tidak ditemukan") {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 404 }
  );
}
