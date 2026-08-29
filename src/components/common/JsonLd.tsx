interface JsonLdProps {
  data: Record<string, unknown>;
}

// JSON.stringify tidak mengamankan `</script>` di HTML. Escape setiap `<`
// agar data menu yang dapat diedit admin tidak bisa menutup elemen script.
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
