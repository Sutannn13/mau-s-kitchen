import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { AdminError, attachPaymentProof } from "@/lib/admin/orders";
import { isValidOrderAccessToken } from "@/lib/order-access";
import { isDeliveryPlanReady } from "@/lib/order-delivery";
import {
  getOrderByPublicAccess,
  OrderStoreUnavailableError,
} from "@/lib/order-store";
import {
  MAX_PROOF_SIZE_BYTES,
  validateProofImage,
} from "@/lib/proof-image";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import {
  readRequestBytesWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/request-body";
import { getServiceClient } from "@/lib/supabase/admin";

const MAX_MULTIPART_SIZE_BYTES = MAX_PROOF_SIZE_BYTES + 128 * 1024;

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
  const rateKey = `proof:${getClientIp(request.headers)}`;
  if (await isRateLimited(rateKey, { maxRequests: 6, windowSeconds: 600 })) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Terlalu banyak unggahan. Tunggu sebentar lalu coba lagi.",
    );
  }

  const contentLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_MULTIPART_SIZE_BYTES
  ) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 1MB.");
  }

  const { kode } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!isValidOrderAccessToken(token)) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }

  let order;
  try {
    order = await getOrderByPublicAccess(kode, token);
  } catch (error) {
    if (error instanceof OrderStoreUnavailableError) {
      return jsonError(503, "ORDER_STORE_UNAVAILABLE", "Unggahan sedang tidak tersedia.");
    }
    throw error;
  }
  if (!order) {
    return jsonError(404, "NOT_FOUND", "Pesanan tidak ditemukan.");
  }
  if (order.paymentMethod === "tunai") {
    return jsonError(409, "PROOF_NOT_ALLOWED", "Pesanan tunai tidak memerlukan bukti bayar.");
  }
  if (!isDeliveryPlanReady({
    orderType: order.customer.orderType,
    deliveryFee: order.deliveryFee,
    deliveryProvider: order.deliveryProvider,
    courierCost: order.courierCost,
  })) {
    return jsonError(
      409,
      "DELIVERY_PLAN_PENDING",
      "Pengantar dan ongkir belum lengkap. Tunggu total akhir sebelum mengirim bukti bayar.",
    );
  }
  if (order.paymentProofUrl || order.status !== "BARU") {
    return jsonError(
      409,
      "PROOF_NOT_ALLOWED",
      "Bukti pembayaran sudah dikirim atau status pesanan telah berubah.",
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return jsonError(
      503,
      "FITUR_BELUM_AKTIF",
      order.paymentMethod === "qris"
        ? "Unggah bukti QRIS sedang tidak tersedia. Hubungi admin sebelum melanjutkan."
        : "Penyimpanan bukti bayar belum dikonfigurasi. Kirim bukti lewat WhatsApp ya.",
    );
  }

  let formData: FormData;
  try {
    const rawBytes = await readRequestBytesWithLimit(
      request,
      MAX_MULTIPART_SIZE_BYTES,
    );
    const boundedBody = new Uint8Array(rawBytes.byteLength);
    boundedBody.set(rawBytes);
    const boundedHeaders = new Headers(request.headers);
    boundedHeaders.delete("content-length");
    boundedHeaders.delete("transfer-encoding");
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: boundedHeaders,
      body: boundedBody.buffer,
    });
    formData = await boundedRequest.formData();
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 1MB.");
    }
    return jsonError(400, "VALIDATION_ERROR", "Format unggahan tidak valid.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "VALIDATION_ERROR", "Berkas bukti bayar wajib dilampirkan.");
  }
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 1MB.");
  }

  const image = await validateProofImage(file);
  if (!image) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Isi berkas harus berupa gambar JPG, PNG, atau WebP yang valid.",
    );
  }

  const path = `${randomUUID()}.${image.extension}`;
  const uploaded = await supabase.storage
    .from("payment-proofs")
    .upload(path, image.bytes, {
      cacheControl: "0",
      contentType: image.mimeType,
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

  return NextResponse.json(
    { success: true, data: { submitted: true } },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
