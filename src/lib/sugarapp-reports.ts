import type { Sale } from "./sugarapp-store";

export function revenueTrend(sales: Sale[], period: "day" | "month" | "all", year: number, now = new Date()) {
  const hourly = period === "day";
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = Array.from({ length: hourly ? 24 : 12 }, (_, i) => ({ label: hourly ? `${String(i).padStart(2, "0")}:00` : String(i), revenue: 0 }));
  for (const sale of sales) {
    const date = new Date(sale.ts);
    if (hourly && (date < start || sale.ts >= start.getTime() + 86400000)) continue;
    if (!hourly && period === "month" && date.getFullYear() !== year) continue;
    const bucket = buckets[hourly ? date.getHours() : date.getMonth()];
    if (bucket) bucket.revenue += sale.total;
  }
  return buckets;
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}