import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nopol = searchParams.get('nopol');

  if (!nopol) {
    return NextResponse.json({ success: false, message: 'Parameter nopol diperlukan' }, { status: 400 });
  }

  const dashcamKey = process.env.DASHCAM_API_KEY;
  if (!dashcamKey) {
    return NextResponse.json({ success: false, message: 'DASHCAM_API_KEY belum dikonfigurasi di server' }, { status: 500 });
  }

  try {
    const response = await fetch('https://dashcam.aldzama.com/api/external/vehicle-locations', {
      headers: {
        'x-api-key': dashcamKey
      },
      next: { revalidate: 10 } // Cache selama 10 detik agar tidak kena rate limit
    });

    if (!response.ok) {
      console.error('Dashcam API returned', response.status);
      return NextResponse.json({ success: false, message: 'Gagal mengambil data dari Dashcam API' }, { status: 502 });
    }

    const data = await response.json();
    
    if (!data.ok || !data.vehicles) {
      return NextResponse.json({ success: false, message: 'Format respons Dashcam tidak valid' }, { status: 500 });
    }

    // Mencocokkan nopol (atau car_name)
    // Seringkali nopol diinput dengan spasi, atau tanpa spasi. Kita hilangkan spasi untuk perbandingan.
    const normalizedNopol = nopol.replace(/\s+/g, '').toLowerCase();

    // Dashcam API menggunakan car_name. Contoh: "HILUX W8372ED" atau "S58"
    const vehicle = data.vehicles.find((v: any) => {
      const normalizedCarName = v.car_name.replace(/\s+/g, '').toLowerCase();
      // Bisa jadi nopol ada di dalam car_name (contoh W8372ED ada di HILUXW8372ED)
      // Atau car_name persis sama dengan nopol
      return normalizedCarName.includes(normalizedNopol) || normalizedNopol.includes(normalizedCarName);
    });

    if (!vehicle) {
      return NextResponse.json({ success: false, message: 'Kendaraan tidak ditemukan di sistem live tracking' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        speed: vehicle.speed,
        lastUpdated: data.last_updated
      }
    });

  } catch (error) {
    console.error('Error fetching dashcam api:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server internal' }, { status: 500 });
  }
}
