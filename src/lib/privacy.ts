export function getOrderRetentionDays(): number | null {
  const value = Number.parseInt(process.env.ORDER_RETENTION_DAYS ?? "", 10);
  return Number.isInteger(value) && value >= 30 && value <= 3_650
    ? value
    : null;
}

export function isPrivacyConfigurationReady(): boolean {
  return getOrderRetentionDays() !== null;
}
