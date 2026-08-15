import { NextResponse } from "next/server";

import { AdminError, attachPaymentProof } from "@/lib/admin/orders";
import { getOrderByCode } from "@/lib/order-store";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/admin";

// Batas unggah bukti bayar (docs/11_API_SPEC.md §11.6).
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export async function POST(
  request: Request,
  context: { params: Promise<{ kode: string }> },
): Promise<NextResponse> {
  const rateKey = `proof:${getClientIp(request.headers)}`;
  if (isRateLimited(rateKey)) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak unggahan. Tunggu sebentar lalu coba lagi.",
    );
  }

  const { kode } = await context.params;
  const order = await getOrderByCode(kode);
  if (!order) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return jsonError(
      503,
      "FITUR_BELUM_AKTIF",
      "Penyimpanan bukti bayar belum dikonfigurasi. Kirim bukti lewat WhatsApp ya.",
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Format unggahan tidak valid.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "VALIDATION_ERROR", "Berkas bukti bayar wajib dilampirkan.");
  }

  const extension = ALLOWED_PROOF_TYPES[file.type];
  if (!extension) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Format berkas harus JPG, PNG, atau WebP.",
    );
  }
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    return jsonError(400, "VALIDATION_ERROR", "Ukuran berkas maksimal 5MB.");
  }

  // Nama file {kode}-{timestamp}.{ext} (docs/11_API_SPEC.md §11.6).
  const timestamp = Date.now();
  const path = `${order.code}-${timestamp}.${extension}`;

  const uploaded = await supabase.storage
    .from("payment-proofs")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploaded.error) {
    console.error("[POST proof]", uploaded.error.message);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan berkas. Coba lagi.");
  }

  try {
    await attachPaymentProof(order.code, path);
  } catch (error) {
    await supabase.storage.from("payment-proofs").remove([path]);
    if (error instanceof AdminError) {
      return jsonError(error.statusCode, error.code, error.message);
    }
    console.error("[POST proof:attach]", error);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menautkan bukti bayar.");
  }

  const { data } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60 * 60);

  return NextResponse.json({
    success: true,
    data: { url: data?.signedUrl ?? null },
  });
}
