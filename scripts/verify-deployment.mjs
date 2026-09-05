const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

function normalizeSiteUrl(value) {
  if (!value) {
    throw new Error(
      "Site URL wajib diberikan sebagai argumen atau NEXT_PUBLIC_SITE_URL.",
    );
  }

  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Deployment publik wajib memakai HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Site URL tidak boleh memuat kredensial, query, atau fragment.");
  }
  if (url.pathname !== "/") {
    throw new Error("Site URL harus menunjuk root domain tanpa path tambahan.");
  }

  return url.origin;
}

function assertIncludes(body, expected, label) {
  if (!body.includes(expected)) {
    throw new Error(`${label} tidak ditemukan pada respons.`);
  }
}

const siteUrl = normalizeSiteUrl(
  process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL,
);

const checks = [
  {
    path: "/",
    validate(body) {
      assertIncludes(body, "<title>MAU", "Title homepage");
      assertIncludes(body, `rel="canonical" href="${siteUrl}`, "Canonical homepage");
    },
  },
  {
    path: "/menu",
    validate(body) {
      assertIncludes(body, "<title>Menu", "Title menu");
      assertIncludes(
        body,
        `rel="canonical" href="${siteUrl}/menu"`,
        "Canonical menu",
      );
    },
  },
  {
    path: "/robots.txt",
    validate(body) {
      const normalizedBody = body.replaceAll("\r\n", "\n");
      assertIncludes(
        normalizedBody,
        "User-Agent: *\nAllow: /",
        "Izin crawler umum",
      );
      assertIncludes(
        normalizedBody,
        `Sitemap: ${siteUrl}/sitemap.xml`,
        "Referensi sitemap",
      );
    },
  },
  {
    path: "/sitemap.xml",
    validate(body) {
      assertIncludes(body, "<urlset", "Root XML sitemap");
      assertIncludes(body, `<loc>${siteUrl}`, "URL produksi pada sitemap");
    },
  },
  {
    path: "/api/health",
    validate(body) {
      const payload = JSON.parse(body);
      if (payload.status !== "ok") {
        throw new Error("Health endpoint tidak mengembalikan status ok.");
      }
    },
  },
];

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function runCheck(check) {
  const url = `${siteUrl}${check.path}`;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "maus-kitchen-deployment-monitor/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const body = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (body.includes("Error 1102") || body.includes("exceeded resource limits")) {
        throw new Error("Cloudflare Error 1102 terdeteksi pada body respons.");
      }

      check.validate(body);
      console.log(
        JSON.stringify({
          event: "deployment_check_passed",
          path: check.path,
          status: response.status,
          cache: response.headers.get("x-opennext-cache"),
          rayId: response.headers.get("cf-ray"),
          attempt,
        }),
      );
      return;
    } catch (error) {
      lastError = error;
      console.error(
        JSON.stringify({
          event: "deployment_check_retry",
          path: check.path,
          attempt,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
      if (attempt < MAX_ATTEMPTS) {
        await wait(attempt * 2_000);
      }
    }
  }

  throw new Error(
    `${check.path} gagal setelah ${MAX_ATTEMPTS} percobaan: ${
      lastError instanceof Error ? lastError.message : "Unknown error"
    }`,
  );
}

// Pemeriksaan sengaja berurutan agar monitor tidak menciptakan burst ke Worker Free.
for (const check of checks) {
  await runCheck(check);
}

console.log(
  JSON.stringify({ event: "deployment_verification_passed", siteUrl }),
);
