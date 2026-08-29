import { NextResponse } from "next/server";

import {
  markPaymentClaimed,
  OrderStoreUnavailableError,
} from "@/lib/order-store";
import { isValidOrderAccessToken } from "@/lib/order-access";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

// POST /api/orders/[kode]/claim?token=...
// Pelanggan menandai "Saya Sudah Bayar" dari halaman /pembayaran/[kode].
// Ini KLAIM, bukan verifikasi: status pesanan tetap BARU sampai admin
// mengonfirmasi (docs/04_BUSINESS_FLOW.md §4.3, docs/11_API_SPEC.md).
// Autorisasi memakai token publik pesanan — tanpa login pelanggan.

function jsonError(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return NextResponse.json(
    { success: false, error, message },
    { status, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ kode: string }> },
): Promise<NextResponse> {
  const rateKey = `claim:${getClientIp(request.headers)}`;
  if (await isRateLimited(rateKey, { maxRequests: 10, windowSeconds: 600 })) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
    );
  }

  const { kode } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isValidOrderAccessToken(token)) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }

  let result;
  try {
    result = await markPaymentClaimed(kode, token);
  } catch (error) {
    if (error instanceof OrderStoreUnavailableError) {
      return jsonError(
        503,
        "ORDER_STORE_UNAVAILABLE",
        "Fitur ini sedang tidak tersedia. Konfirmasi lewat WhatsApp ya.",
      );
    }
    console.error("[POST /api/orders/:kode/claim]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan konfirmasi.");
  }

  switch (result.outcome) {
    case "not-found":
      return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
    case "not-allowed":
      return jsonError(409, "CLAIM_NOT_ALLOWED", result.message);
    // Klaim ulang diperlakukan sukses agar tombol idempoten saat pelanggan
    // menekan dua kali atau memuat ulang halaman.
    case "already-claimed":
    case "claimed":
      return NextResponse.json(
        {
          success: true,
          data: { paymentClaimed: true, paymentClaimedAt: result.claimedAt },
        },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
  }
}
