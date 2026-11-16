export const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx7tZOc4sTj_olfdJZPumCK7li7jlxazT26n88SncZzo208ZH765UZ0w5P0kNaD3g/exec";

export function configuredWebhook(url?: string) {
  return url?.trim() || DEFAULT_WEBHOOK_URL;
}