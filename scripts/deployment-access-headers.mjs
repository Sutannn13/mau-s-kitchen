const STAGING_HOSTNAME = "staging.maukitchen.my.id";

export function getDeploymentAccessHeaders(siteUrl, env = process.env) {
  const clientId = env.CF_ACCESS_CLIENT_ID?.trim();
  const clientSecret = env.CF_ACCESS_CLIENT_SECRET?.trim();
  const isStaging = new URL(siteUrl).hostname === STAGING_HOSTNAME;

  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error(
      "CF_ACCESS_CLIENT_ID dan CF_ACCESS_CLIENT_SECRET wajib diisi bersamaan.",
    );
  }

  if (!clientId || !clientSecret) {
    if (isStaging) {
      throw new Error(
        "Staging wajib memakai CF_ACCESS_CLIENT_ID dan CF_ACCESS_CLIENT_SECRET.",
      );
    }
    return {};
  }

  // Access credentials may only leave CI for the exact staging host.
  if (!isStaging) {
    throw new Error("Cloudflare Access credentials hanya boleh dikirim ke staging.");
  }

  return {
    "CF-Access-Client-Id": clientId,
    "CF-Access-Client-Secret": clientSecret,
  };
}
