import { NextResponse } from 'next/server';

export async function GET() {
  const dashcamKey = process.env.DASHCAM_API_KEY;

  if (!dashcamKey) {
    return NextResponse.json(
      { ok: false, message: 'DASHCAM_API_KEY belum dikonfigurasi di server' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://dashcam.aldzama.com/api/external/vehicle-locations', {
      headers: {
        'x-api-key': dashcamKey,
      },
      // Cache data for 10 seconds to avoid hitting rate limits
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      console.error('Dashcam API returned error status:', response.status);
      return NextResponse.json(
        { ok: false, message: 'Gagal mengambil data dari Dashcam API' },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.ok || !data.vehicles) {
      return NextResponse.json(
        { ok: false, message: 'Format respons Dashcam tidak valid' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      last_updated: data.last_updated,
      vehicles: data.vehicles,
    });
  } catch (error) {
    console.error('Error fetching dashcam api:', error);
    return NextResponse.json(
      { ok: false, message: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
