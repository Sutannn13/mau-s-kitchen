// Renderer JSON-LD generik. data dimasukkan via JSON.stringify agar aman
// dari injeksi markup; konten berasal dari data internal, bukan input user.
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
