import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readRequestBytesWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/request-body";

function streamingRequest(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Request("http://localhost/test", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
}

describe("readRequestBytesWithLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("menggabungkan request streaming yang masih di bawah batas", async () => {
    const bytes = await readRequestBytesWithLimit(
      streamingRequest(["MAU'S ", "Kitchen"]),
      32,
    );

    expect(new TextDecoder().decode(bytes)).toBe("MAU'S Kitchen");
  });

  it("menghentikan request streaming segera setelah melewati batas", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("12345678"));
      },
      cancel() {
        cancelled = true;
      },
    });
    const request = new Request("http://localhost/test", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);

    await expect(
      readRequestBytesWithLimit(request, 7),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
    expect(cancelled).toBe(true);
  });

  it("tetap mengembalikan error batas saat pembatalan stream gagal", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("12345678"));
      },
      cancel() {
        return Promise.reject(new Error("cancel failed"));
      },
    });
    const request = new Request("http://localhost/test", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);

    await expect(
      readRequestBytesWithLimit(request, 7),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "[request-body] Failed to cancel oversized request stream.",
      );
    });
  });

  it("tidak menunggu pembatalan stream yang tidak pernah selesai", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("12345678"));
      },
      cancel() {
        return new Promise<void>(() => undefined);
      },
    });
    const request = new Request("http://localhost/test", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);

    await expect(
      readRequestBytesWithLimit(request, 7),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
