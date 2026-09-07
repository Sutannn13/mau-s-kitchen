const STAGING_HOSTNAME = "staging.maukitchen.my.id";

// Deployment URL is trusted build/runtime config; never let a request Host header toggle policy.
export function isStagingDeployment(siteUrl: string | undefined): boolean {
  if (!siteUrl) {
    return false;
  }

  try {
    return new URL(siteUrl).hostname === STAGING_HOSTNAME;
  } catch {
    return false;
  }
}
