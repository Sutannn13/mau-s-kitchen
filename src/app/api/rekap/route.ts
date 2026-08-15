import { NextResponse } from "next/server";

import { AdminError, getRekapData } from "@/lib/admin/orders";
import { verifyAdminRequest } from "@/lib/supabase/auth";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function jsonError(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return NextResponse.json(
    { success: false, error, message },
    { status },
  );
}

function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// GET /api/rekap?dari=YYYY-MM-DD&sampai=YYYY-MM-DD — admin saja.
// Parameter tunggal ?tanggal= dari docs/11 §11.8 tetap didukung (satu hari).
export async function GET(request: Request): Promise<NextResponse> {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return jsonError(401, "UNAUTHORIZED", "Khusus admin. Silakan login ulang.");
  }

  const url = new URL(request.url);
  const tanggal = url.searchParams.get("tanggal");
  const dari = url.searchParams.get("dari") ?? tanggal ?? jakartaToday();
  const sampai = url.searchParams.get("sampai") ?? dari;

  if (!DATE_PATTERN.test(dari) || !DATE_PATTERN.test(sampai)) {
    return jsonError(400, "VALIDATION_ERROR", "Format tanggal harus YYYY-MM-DD.");
  }
  if (dari > sampai) {
    return jsonError(400, "VALIDATION_ERROR", "Tanggal awal melebihi tanggal akhir.");
  }

  try {
    const rekap = await getRekapData(dari, sampai);
    if (!rekap) {
      return jsonError(
        503,
        "FITUR_BELUM_AKTIF",
        "Database belum dikonfigurasi. Ikuti docs/19_SETUP_MANUAL.md.",
      );
    }
    return NextResponse.json({ success: true, data: rekap });
  } catch (error) {
    if (error instanceof AdminError) {
      return jsonError(error.statusCode, error.code, error.message);
    }
    console.error("[GET /api/rekap]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal memuat rekap.");
  }
}
