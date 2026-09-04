import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminService } from "@/lib/admin/menu";
import { MAX_MENU_IMAGE_BYTES, validateMenuImage } from "@/lib/menu-image";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import {
  readRequestBytesWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/request-body";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Maks multipart sedikit lebih besar dari batas gambar asli (overhead form).
const MAX_MULTIPART_SIZE_BYTES = MAX_MENU_IMAGE_BYTES + 512 * 1024;

function jsonError(status: number, error: string, message: string): NextResponse {
  return NextResponse.json(
    { success: false, error, message },
    { status },
  );
}

// POST /api/admin/menu/items/[id]/image — upload foto menu (multipart).
// Disimpan apa adanya di bucket publik menu-images (validasi via magic bytes,
// tanpa sharp agar kompatibel dengan Cloudflare Workers), lalu image_path pada
// menu_items diperbarui. Rate-limit 6/menit per admin.
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const guard = await requireAdminService(request);
  if (!guard.ok) {
    return guard.response;
  }
  const { supabase } = guard;
  const { id } = await context.params;

  const rateKey = `menuimg:${getClientIp(request.headers)}`;
  if (await isRateLimited(rateKey, { maxRequests: 6, windowSeconds: 60 })) {
    return jsonError(429, "RATE_LIMITED", "Terlalu banyak unggahan. Tunggu sebentar lalu coba lagi.");
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_SIZE_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 3MB.");
  }

  const exists = await supabase.from("menu_items").select("id").eq("id", id).maybeSingle();
  if (exists.error || !exists.data) {
    return jsonError(404, "NOT_FOUND", "Item menu tidak ditemukan.");
  }

  let formData: FormData;
  try {
    // Body dibaca dengan batas keras sebelum parse — Content-Length pre-check
    // di atas bisa absen pada chunked encoding (pola route proof upload).
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
      return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 3MB.");
    }
    return jsonError(400, "VALIDATION_ERROR", "Format unggahan tidak valid.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "VALIDATION_ERROR", "Berkas foto wajib dilampirkan.");
  }
  if (file.size > MAX_MENU_IMAGE_BYTES) {
    return jsonError(413, "PAYLOAD_TOO_LARGE", "Ukuran berkas maksimal 3MB.");
  }

  const image = await validateMenuImage(file);
  if (!image) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Berkas harus berupa gambar JPG, PNG, atau WebP yang valid.",
    );
  }

  const path = `${id}.${randomUUID()}.${image.extension}`;
  const uploaded = await supabase.storage
    .from("menu-images")
    .upload(path, image.bytes, {
      cacheControl: "public, max-age=31536000, immutable",
      contentType: image.mimeType,
      upsert: false,
    });

  if (uploaded.error) {
    console.error("[POST menu image:upload]", uploaded.error.message);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menyimpan foto. Coba lagi.");
  }

  const publicUrl = supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;

  const updated = await supabase
    .from("menu_items")
    .update({ image_path: publicUrl })
    .eq("id", id);

  if (updated.error) {
    // Bersihkan file yatim agar tidak menumpuk di storage.
    await supabase.storage.from("menu-images").remove([path]);
    console.error("[POST menu image:update]", updated.error.message);
    return jsonError(500, "INTERNAL_ERROR", "Gagal menautkan foto ke item.");
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { imagePath: publicUrl } });
}
