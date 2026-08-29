import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_PROOF_SIZE_BYTES } from "@/lib/proof-image";

const mocks = vi.hoisted(() => ({
  attachPaymentProof: vi.fn(),
  getOrderByPublicAccess: vi.fn(),
  getServiceClient: vi.fn(),
  isDeliveryPlanReady: vi.fn(),
  isRateLimited: vi.fn(),
  isValidOrderAccessToken: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/admin/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/orders")>()),
  attachPaymentProof: mocks.attachPaymentProof,
}));
vi.mock("@/lib/order-access", () => ({
  isValidOrderAccessToken: mocks.isValidOrderAccessToken,
}));
vi.mock("@/lib/order-delivery", () => ({
  isDeliveryPlanReady: mocks.isDeliveryPlanReady,
}));
vi.mock("@/lib/order-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/order-store")>()),
  getOrderByPublicAccess: mocks.getOrderByPublicAccess,
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  isRateLimited: mocks.isRateLimited,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: mocks.getServiceClient,
}));

import { POST } from "@/app/api/orders/[kode]/proof/route";

const VALID_PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x01, 0x49, 0x44, 0x41, 0x54,
  0x00,
  0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

function uploadRequest(bytes: Uint8Array, type: string, filename: string): Request {
  const fileBytes = new Uint8Array(bytes.byteLength);
  fileBytes.set(bytes);
  const formData = new FormData();
  formData.append("file", new File([fileBytes.buffer], filename, { type }));
  return new Request("http://localhost/api/orders/MK-260824-999/proof?token=test-token", {
    method: "POST",
    body: formData,
  });
}

function oversizedChunkedRequest(): Request {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_PROOF_SIZE_BYTES));
      controller.enqueue(new Uint8Array(128 * 1024 + 1));
      controller.close();
    },
  });

  return new Request(
    "http://localhost/api/orders/MK-260824-999/proof?token=test-token",
    {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=test" },
      body,
      duplex: "half",
    } as RequestInit,
  );
}

async function post(request: Request) {
  return POST(request, {
    params: Promise.resolve({ kode: "MK-260824-999" }),
  });
}

describe("POST /api/orders/[kode]/proof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isRateLimited.mockResolvedValue(false);
    mocks.isValidOrderAccessToken.mockReturnValue(true);
    mocks.isDeliveryPlanReady.mockReturnValue(true);
    mocks.getOrderByPublicAccess.mockResolvedValue({
      code: "MK-260824-999",
      status: "BARU",
      paymentMethod: "qris",
      paymentProofUrl: null,
      customer: { orderType: "ambil" },
      deliveryFee: 0,
      deliveryProvider: null,
      courierCost: null,
    });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.attachPaymentProof.mockResolvedValue(undefined);
    mocks.getServiceClient.mockReturnValue({
      storage: {
        from: () => ({ upload: mocks.upload, remove: mocks.remove }),
      },
    });
  });

  it("menyimpan gambar kecil yang struktur dan tipenya valid", async () => {
    const response = await post(uploadRequest(VALID_PNG, "image/png", "bukti.png"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { submitted: true },
    });
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.attachPaymentProof).toHaveBeenCalledWith(
      "MK-260824-999",
      expect.stringMatching(/^[0-9a-f-]+\.png$/),
    );
  });

  it("menolak upload yang lebih besar dari 1MB", async () => {
    const oversized = new Uint8Array(MAX_PROOF_SIZE_BYTES + 1);
    const response = await post(
      uploadRequest(oversized, "image/png", "terlalu-besar.png"),
    );

    expect(response.status).toBe(413);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("menolak multipart chunked yang melewati batas tanpa Content-Length", async () => {
    const response = await post(oversizedChunkedRequest());

    expect(response.status).toBe(413);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("menolak HTML yang disamarkan sebagai JPG", async () => {
    const fakeJpeg = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const response = await post(
      uploadRequest(fakeJpeg, "image/jpeg", "bukti.jpg"),
    );

    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
