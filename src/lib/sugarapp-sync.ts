import type { Expense, Sale, SugarState, Waste } from "./sugarapp-store";

export interface SyncEvent { eventId: string; sheetType: "Transaksi" | "Pengeluaran" | "Terbuang"; action: "CREATE" | "UPDATE" | "DELETE"; id: string; rowValues: (string | number)[]; test?: boolean }
export function validWebhook(url: string) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);
}
function row(type: SyncEvent["sheetType"], value: Sale | Expense | Waste): (string | number)[] {
  const date = new Date(value.ts);
  const prefix = [value.id, date.toLocaleDateString("en-CA"), date.toLocaleTimeString("id-ID")];
  if (type === "Transaksi" && "total" in value) return [...prefix, value.items.map(x => x.name).join("; "), value.items.map(x => `${x.sweetness ?? ""} ${x.ml} ml ${x.serving} ×${x.qty}`).join("; "), value.method, value.total, value.cost, value.total - value.cost];
  if (type === "Pengeluaran" && "amount" in value) return [...prefix, value.category, value.note, value.restock?.qty ?? 0, value.amount];
  if ("cost" in value && !("total" in value)) return [...prefix, value.items.map(x => x.name).join("; "), value.items.map(x => `${x.qty} ${x.unit}`).join("; "), value.cost];
  return prefix;
}
export function recordEvents(previous: SugarState, next: SugarState): SyncEvent[] {
  const events: SyncEvent[] = [];
  for (const [key, sheetType] of [["sales", "Transaksi"], ["expenses", "Pengeluaran"], ["waste", "Terbuang"]] as const) {
    const before = new Map(previous[key].map(x => [x.id, x]));
    const after = new Map(next[key].map(x => [x.id, x]));
    for (const value of next[key]) {
      const old = before.get(value.id);
      if (JSON.stringify(old) === JSON.stringify(value)) continue;
      events.push({ eventId: crypto.randomUUID(), sheetType, action: old ? "UPDATE" : "CREATE", id: value.id, rowValues: row(sheetType, value) });
    }
    for (const value of previous[key]) if (!after.has(value.id)) events.push({ eventId: crypto.randomUUID(), sheetType, action: "DELETE", id: value.id, rowValues: row(sheetType, value) });
  }
  return events;
}

export function fullSyncEvents(state: SugarState, now = new Date()): SyncEvent[] {
  const events = recordEvents({ ...state, sales: [], expenses: [], waste: [] }, state);
  if (events.length) return events;
  return [{ eventId: crypto.randomUUID(), sheetType: "Transaksi", action: "CREATE", id: "TEST-001", rowValues: ["TEST-001", now.toLocaleDateString("en-CA"), now.toLocaleTimeString("id-ID"), "Test Koneksi SugarApp", "1x Susu Ori (14 oz)", "Tunai", 8000, 3000, 5000] }];
}

// Preserve already queued events from the former date/time/ID format.
export function normalizeQueuedEvent(event: SyncEvent): SyncEvent {
  if (event.rowValues[0] === event.id || event.rowValues[2] !== event.id) return event;
  const old = event.rowValues;
  const prefix = [event.id, old[0] ?? "", old[1] ?? ""];
  const tail = event.sheetType === "Transaksi" ? old.slice(3) : event.sheetType === "Pengeluaran" ? [old[3] ?? "", old[4] ?? "", 0, old[6] ?? 0] : [old[3] ?? "", old[4] ?? "", old[6] ?? 0];
  return { ...event, rowValues: [...prefix, ...tail] };
}

// Opaque no-cors responses prove dispatch, never receipt by Google Sheets.
export async function dispatchEvent(url: string, event: SyncEvent, sender: typeof fetch = fetch) {
  if (!validWebhook(url.trim())) throw new Error("URL Google Apps Script tidak valid");
  await sender(url.trim(), { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(normalizeQueuedEvent(event)), signal: AbortSignal.timeout(15000) });
}
interface SyncStore { get: () => SugarState; update: (fn: (s: SugarState) => SugarState) => void }
let running: Promise<void> | undefined;
export function flushSync(store: SyncStore) {
  if (running) return running;
  running = Promise.resolve().then(async () => {
    let failed = false;
    try {
      if (!navigator.onLine || !validWebhook((store.get().webhookUrl ?? "").trim()) || !store.get().syncQueue?.length) return;
      store.update(s => ({ ...s, syncStatus: "sending" }));
      while (navigator.onLine) {
        const current = store.get(); const event = current.syncQueue?.[0]; const url = current.webhookUrl ?? "";
        if (!event || !validWebhook(url.trim())) break;
        await dispatchEvent(url, event);
        store.update(s => ({ ...s, syncQueue: (s.syncQueue ?? []).filter(x => x.eventId !== event.eventId), lastDispatch: Date.now() }));
      }
    } catch {
      failed = true;
    } finally {
      store.update(s => ({ ...s, syncStatus: failed ? "failed" : "dispatched" }));
    }
  }).finally(() => { running = undefined; });
  return running;
}
export function startSync(store: SyncStore) {
  const retry = () => { void flushSync(store).catch(() => undefined); };
  window.addEventListener("online", retry);
  const timer = window.setInterval(retry, 30000); retry();
  return () => { window.removeEventListener("online", retry); window.clearInterval(timer); };
}