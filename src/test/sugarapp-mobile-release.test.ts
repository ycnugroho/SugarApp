import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { configuredWebhook, DEFAULT_WEBHOOK_URL } from "@/lib/sugarapp-config";
import { checkoutState, expenseState, initialState, makeLine, wasteState } from "@/lib/sugarapp-store";
import { dispatchEvent, fullSyncEvents, normalizeQueuedEvent, recordEvents } from "@/lib/sugarapp-sync";

const base = () => initialState(false);
function records() {
  const s = base();
  const menu = s.menu.find(x => x.name === "Susu Ori Tawar");
  if (!menu) throw new Error("Missing menu");
  let next = checkoutState(s, [makeLine(menu, "cup", "hot", 2, 400, "Tawar")], "tunai");
  next = expenseState(next, { id: "taro-expense", ts: Date.now(), category: "Taro", note: "Beli bubuk taro", amount: 35000, restock: { id: "taro", qty: 500, unit: "Gram", previousUnitCost: 0, unitCost: 0 } });
  return wasteState(next, { taro: 20 }, "Tumpah");
}

describe("SugarApp mobile release rules", () => {
  it("automatically configures the exact owner webhook on a new device", () => {
    expect(base().webhookUrl).toBe("https://script.google.com/macros/s/AKfycbx7tZOc4sTj_olfdJZPumCK7li7jlxazT26n88SncZzo208ZH765UZ0w5P0kNaD3g/exec");
  });
  it("fills missing and blank old-device configuration while preserving custom URLs", () => {
    expect(configuredWebhook(undefined)).toBe(DEFAULT_WEBHOOK_URL);
    expect(configuredWebhook(" ")).toBe(DEFAULT_WEBHOOK_URL);
    expect(configuredWebhook("https://script.google.com/macros/s/custom/exec")).toBe("https://script.google.com/macros/s/custom/exec");
  });
  it("Taro stock purchases add 500 Gram and record Rp 35000", () => {
    const s = records();
    expect(s.inventory.find(x => x.id === "taro")?.qty).toBe(1480);
    expect(s.expenses[0]).toMatchObject({ category: "Taro", amount: 35000, restock: { qty: 500, unit: "Gram" } });
  });
  it.each(["Listrik & Air", "Gas / LPG", "Transportasi & Bensin", "Gaji / Operasional", "Sewa", "Lain-lain"])("%s records an expense without changing inventory", category => {
    const s = base();
    const next = expenseState(s, { id: "ops", ts: Date.now(), category, note: "", amount: 20000 });
    expect(next.inventory).toEqual(s.inventory);
    expect(next.expenses[0]).toMatchObject({ category, amount: 20000 });
    expect(next.expenses[0]?.restock).toBeUndefined();
  });
  it.each(["automatic", "manual"])("%s sync has exact ordered nine/seven/six-column payloads", mode => {
    const s = records();
    const events = mode === "automatic" ? recordEvents(base(), s) : fullSyncEvents(s);
    const sale = s.sales[0]; const waste = s.waste[0];
    if (!sale || !waste) throw new Error("Missing records");
    expect(events[0]).toMatchObject({ sheetType: "Transaksi", id: sale.id });
    expect(events[0]?.rowValues).toEqual([sale.id, expect.any(String), expect.any(String), "Susu Ori Tawar", "Tawar 400 ml hot ×2", "tunai", 16000, 6000, 10000]);
    expect(events[1]).toMatchObject({ sheetType: "Pengeluaran", id: "taro-expense" });
    expect(events[1]?.rowValues).toEqual(["taro-expense", expect.any(String), expect.any(String), "Taro", "Beli bubuk taro", 500, 35000]);
    expect(events[2]).toMatchObject({ sheetType: "Terbuang", id: waste.id });
    expect(events[2]?.rowValues).toEqual([waste.id, expect.any(String), expect.any(String), "Taro", "20 Gram", 1400]);
  });
  it("operational Sheets rows have zero incoming stock and no placeholder separator", () => {
    const s = base(); const next = expenseState(s, { id: "ops", ts: Date.now(), category: "Listrik & Air", note: "", amount: 20000 });
    expect(recordEvents(s, next)[0]?.rowValues).toEqual(["ops", expect.any(String), expect.any(String), "Listrik & Air", "", 0, 20000]);
  });
  it("normalizes previous queued expense and waste rows to the current schema", () => {
    expect(normalizeQueuedEvent({ eventId: "e", id: "x", action: "CREATE", sheetType: "Pengeluaran", rowValues: ["date", "time", "x", "Gas", "note", "", 20000] }).rowValues).toEqual(["x", "date", "time", "Gas", "note", 0, 20000]);
    expect(normalizeQueuedEvent({ eventId: "w", id: "y", action: "CREATE", sheetType: "Terbuang", rowValues: ["date", "time", "y", "Taro", "20 Gram", "", 1400] }).rowValues).toEqual(["y", "date", "time", "Taro", "20 Gram", 1400]);
  });
  it("dispatches each row to the configured webhook with its unchanged sheet type", async () => {
    const sender = vi.fn().mockResolvedValue({ type: "opaque" });
    const events = fullSyncEvents(records());
    for (const event of events) await dispatchEvent(DEFAULT_WEBHOOK_URL, event, sender);
    expect(sender.mock.calls.map(call => call[0])).toEqual([DEFAULT_WEBHOOK_URL, DEFAULT_WEBHOOK_URL, DEFAULT_WEBHOOK_URL]);
    expect(sender.mock.calls.map(call => JSON.parse(call[1].body).sheetType)).toEqual(["Transaksi", "Pengeluaran", "Terbuang"]);
  });
  it("Apps Script receiver writes each type only to its named tab with its exact row width", () => {
    const sheets = new Map<string, unknown[][]>();
    const book = {
      getSheetByName: (name: string) => sheets.has(name) ? sheet(name) : null,
      insertSheet: (name: string) => { sheets.set(name, []); return sheet(name); },
    };
    function sheet(name: string) {
      const rows = sheets.get(name);
      if (!rows) throw new Error("Missing sheet");
      return {
        getLastRow: () => rows.length,
        appendRow: (row: unknown[]) => rows.push(row),
        getRange: () => ({ getValue: () => rows[0]?.[0], createTextFinder: () => ({ matchEntireCell: () => ({ findNext: () => null }) }) }),
      };
    }
    const context = { SpreadsheetApp: { getActiveSpreadsheet: () => book }, LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) }, ContentService: { createTextOutput: (text: string) => text }, doPost: undefined as undefined | ((event: { postData: { contents: string } }) => string) };
    runInNewContext(readFileSync("public/sugarapp-sheets.gs", "utf8"), context);
    if (!context.doPost) throw new Error("Missing receiver");
    for (const event of fullSyncEvents(records())) expect(context.doPost({ postData: { contents: JSON.stringify(event) } })).toBe("OK");
    expect(sheets.get("Transaksi")?.[1]).toHaveLength(9);
    expect(sheets.get("Pengeluaran")?.[1]).toHaveLength(7);
    expect(sheets.get("Terbuang")?.[1]).toHaveLength(6);
    expect(sheets.get("Pengeluaran")?.[1]?.[3]).toBe("Taro");
    expect(sheets.get("Terbuang")?.[1]?.[4]).toBe("20 Gram");
  });
});