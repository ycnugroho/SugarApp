import { describe, expect, it, vi, afterEach } from "vitest";
import { checkoutState, expenseState, freshMenu, initialState, makeLine, summary, wasteState } from "@/lib/sugarapp-store";
import { dispatchEvent, flushSync, fullSyncEvents, recordEvents, validWebhook } from "@/lib/sugarapp-sync";
const base = () => initialState(false);
const purchase = { id: "purchase", ts: 100, category: "Bahan Baku Tambahan", note: "milk", amount: 50000, restock: { id: "milk", qty: 5, unit: "Liter", previousUnitCost: 0, unitCost: 0 } };
afterEach(() => vi.unstubAllGlobals());
describe("expense restock", () => {
  it("adds five liters and records Rp 50000 expense and Rp 10000 per liter", () => {
    const next = expenseState(base(), purchase);
    expect(next.inventory.find(x => x.id === "milk")).toMatchObject({ qty: 30, purchase: 50000, capacity: 5 });
    expect(summary(next)).toMatchObject({ expense: 50000, profit: -50000 });
  });
  it("deleting a purchase reverses quantity, cost and report", () => {
    const next = expenseState(expenseState(base(), purchase), undefined, "purchase");
    expect(next.inventory.find(x => x.id === "milk")).toMatchObject({ qty: 25, purchase: 45000 });
    expect(summary(next).expense).toBe(0);
  });
  it("editing a purchase replaces restock instead of duplicating it", () => {
    const next = expenseState(expenseState(base(), purchase), { ...purchase, amount: 24000, restock: { ...purchase.restock, qty: 2 } });
    expect(next.inventory.find(x => x.id === "milk")).toMatchObject({ qty: 27, purchase: 60000 });
    expect(next.expenses).toHaveLength(1); expect(summary(next).expense).toBe(24000);
  });
  it("reverses captured units after changing liters to ml", () => {
    const s = expenseState(base(), purchase); s.inventory = s.inventory.map(x => x.id === "milk" ? { ...x, unit: "Ml", qty: 30000, capacity: 5000 } : x);
    expect(expenseState(s, undefined, "purchase").inventory.find(x => x.id === "milk")).toMatchObject({ qty: 25000, purchase: 45000 });
  });
  it("refuses reversal when purchased stock is already consumed", () => {
    const s = expenseState(base(), purchase); const consumed = wasteState(s, { milk: 28 }, "");
    expect(() => expenseState(consumed, undefined, "purchase")).toThrow();
    expect(consumed.expenses).toHaveLength(1); expect(consumed.inventory.find(x => x.id === "milk")?.qty).toBe(2);
  });
});
describe("fresh choices", () => {
  it("projects one Ori without deleting stored menu variants", () => {
    const s = base(); expect(freshMenu(s.menu).filter(x => x.name.startsWith("Susu Ori"))).toHaveLength(1);
    expect(s.menu.filter(x => x.name.startsWith("Susu Ori"))).toHaveLength(3);
  });
  it.each(["Tawar", "Manis", "Summer"] as const)("snapshots %s on every fresh flavor at fixed 400ml", sweetness => {
    for (const product of freshMenu(base().menu)) {
      const line = makeLine(product, "cup", "cold", 2, 250, sweetness);
      expect(line.sweetness).toBe(sweetness); expect(line.ml).toBe(400); expect(line.qty).toBe(2);
    }
  });
  it("Tawar removes added sugar but keeps flavor recipe", () => {
    const p = base().menu.find(x => x.name === "Susu Cokelat"); if (!p) throw new Error("missing");
    expect(makeLine(p, "cup", "hot", 1, 400, "Tawar").recipe).toEqual({ cokelat: 15 });
    expect(makeLine(p, "cup", "hot", 1, 400, "Manis").key).not.toBe(makeLine(p, "cup", "hot", 1, 400, "Summer").key);
  });
});
describe("Sheets queue", () => {
  it("manual empty sync produces the specified TEST-001 accounting row", () => {
    expect(fullSyncEvents(base())[0]).toMatchObject({ sheetType: "Transaksi", action: "CREATE", id: "TEST-001" });
    expect(fullSyncEvents(base())[0]?.rowValues.slice(3)).toEqual(["Test Koneksi SugarApp", "1x Susu Ori (14 oz)", "Tunai", 8000, 3000, 5000]);
  });
  it("manual sync includes every existing record from all three sheets", () => {
    const s = base(); const p = s.menu[0]; if (!p) throw new Error("missing");
    const next = wasteState(expenseState(checkoutState(s, [makeLine(p, "cup", "hot", 1, 400)], "tunai"), purchase), { milk: 1 }, "");
    expect(fullSyncEvents(next).map(e => e.sheetType)).toEqual(["Transaksi", "Pengeluaran", "Terbuang"]);
  });
  it("empty queue always clears a stale sending status", async () => {
    let state = { ...base(), webhookUrl: "https://script.google.com/macros/s/test/exec", syncStatus: "sending" as const } as ReturnType<typeof base>;
    await flushSync({ get: () => state, update: fn => { state = fn(state); } });
    expect(state.syncStatus).not.toBe("sending");
  });
  it("offline retains pending rows and clears loading", async () => {
    let state = base(); state.syncQueue = fullSyncEvents(state); state.syncStatus = "sending";
    vi.stubGlobal("navigator", { onLine: false }); const send = vi.fn(); vi.stubGlobal("fetch", send);
    await flushSync({ get: () => state, update: fn => { state = fn(state); } });
    expect(send).not.toHaveBeenCalled(); expect(state.syncQueue).toHaveLength(1); expect(state.syncStatus).not.toBe("sending");
  });
  it.each([["sales", "Transaksi"], ["expenses", "Pengeluaran"], ["waste", "Terbuang"]] as const)("tracks CREATE UPDATE DELETE for %s", (key, sheet) => {
    const s = base(); const p = s.menu[0]; if (!p) throw new Error("missing");
    const n = key === "sales" ? checkoutState(s, [makeLine(p, "cup", "hot", 1, 400)], "tunai") : key === "expenses" ? expenseState(s, purchase) : wasteState(s, { milk: 1 }, "");
    const events = recordEvents(s, n); expect(events[0]).toMatchObject({ sheetType: sheet, action: "CREATE" }); expect(events[0]?.rowValues).toHaveLength(key === "sales" ? 9 : key === "expenses" ? 7 : 6); expect(events[0]?.rowValues[0]).toBe(events[0]?.id);
    const edit = structuredClone(n); const first = edit[key][0]; if (!first) throw new Error("missing"); first.ts = 123;
    expect(recordEvents(n, edit)[0]?.action).toBe("UPDATE"); expect(recordEvents(n, s)[0]?.action).toBe("DELETE");
  });
  it("validates only deployed Apps Script HTTPS URLs", () => {
    expect(validWebhook("https://script.google.com/macros/s/test/exec")).toBe(true);
    expect(validWebhook("https://example.com/exec")).toBe(false);
  });
  it("uses text/plain no-cors with full payload", async () => {
    const event = recordEvents(base(), expenseState(base(), purchase))[0]; if (!event) throw new Error("missing");
    const sender = vi.fn().mockResolvedValue({ type: "opaque" });
    await dispatchEvent("https://script.google.com/macros/s/test/exec", event, sender);
    expect(sender.mock.calls[0]?.[1]).toMatchObject({ method: "POST", mode: "no-cors", body: JSON.stringify(event) });
  });
  it("retains failed event and dispatches queue serially on retry", async () => {
    let state = expenseState(base(), purchase); state.webhookUrl = "https://script.google.com/macros/s/test/exec"; state.syncQueue = recordEvents(base(), state);
    const second = { ...state.syncQueue[0], eventId: "second" }; if (!second.id || !second.sheetType || !second.action || !second.rowValues) throw new Error("missing");
    state.syncQueue.push({ ...second, id: second.id, sheetType: second.sheetType, action: second.action, rowValues: second.rowValues });
    const store = { get: () => state, update: (fn: (s: typeof state) => typeof state) => { state = fn(state); } };
    const send = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ type: "opaque" }); vi.stubGlobal("fetch", send);
    await flushSync(store); expect(state.syncQueue).toHaveLength(2); expect(state.syncStatus).toBe("failed");
    await flushSync(store); expect(state.syncQueue).toHaveLength(0);
    expect(JSON.parse(send.mock.calls[2]?.[1].body).eventId).toBe("second");
  });
});