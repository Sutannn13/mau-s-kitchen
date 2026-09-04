import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentProofActions } from "@/components/common/PaymentProofActions";

const baseProps = {
  code: "MK-260904-001",
  token: "a".repeat(43),
  confirmationUrl: "https://wa.me/6281617691585",
  resendUrl: "https://wa.me/6281617691585",
  trackingUrl: "/pesanan/MK-260904-001",
  canUploadProof: true,
  proofSubmitted: false,
  claimedAt: null,
  canClaim: true,
};

describe("PaymentProofActions QRIS", () => {
  it("mewajibkan upload dan tidak menawarkan skip WhatsApp", () => {
    const html = renderToStaticMarkup(
      <PaymentProofActions {...baseProps} proofRequired />,
    );

    expect(html).toContain("Unggah Bukti Bayar");
    expect(html).not.toContain("Kirim bukti lewat WhatsApp");
    expect(html).not.toContain("Saya Sudah Bayar");
  });

  it("tetap meminta proof pada klaim QRIS lama yang belum berbukti", () => {
    const html = renderToStaticMarkup(
      <PaymentProofActions
        {...baseProps}
        claimedAt="2026-09-04T04:00:00.000Z"
        proofRequired
      />,
    );

    expect(html).toContain("Unggah Bukti Bayar");
    expect(html).not.toContain("Menunggu konfirmasi admin");
  });

  it("fallback transfer membuka WhatsApp dan tidak mengklaim bukti terkirim", () => {
    const html = renderToStaticMarkup(
      <PaymentProofActions {...baseProps} proofRequired={false} />,
    );

    expect(html).toContain('href="https://wa.me/6281617691585"');
    expect(html).toContain("Kirim bukti lewat WhatsApp");
    expect(html).not.toContain("Saya Sudah Bayar &amp; Kirim Bukti");
  });
});
