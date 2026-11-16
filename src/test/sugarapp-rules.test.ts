import { describe, expect, it } from "vitest";
import { checkoutState, initialState, makeLine, menuDefaults, reviseSaleState, reviseWasteState, summary, volume, wasteState } from "@/lib/sugarapp-store";
import { revenueTrend } from "@/lib/sugarapp-reports";
const menu = menuDefaults();
const find = (name: string) => { const p = menu.find((x) => x.name === name); if (!p) throw new Error(name); return p; };
describe("SugarApp menu pricing", () => {
  it.each(["Tawar", "Manis", "Summer"])("Ori %s costs 8000 hot / 9000 cold", (name) => { expect(find(`Susu Ori ${name}`).prices.cup.hot.sale).toBe(8000); expect(find(`Susu Ori ${name}`).prices.cup.cold.sale).toBe(9000); });
  it.each(["Cokelat", "Stroberi", "Moka", "Melon", "Anggur", "Vanila", "Durian", "Leci", "Taro", "Matcha", "Bluberry", "Mangga", "Banana", "Bubble Gum", "Apel", "Karamel", "Cappucino", "Butterscotch", "Green Tea"])("Standard %s costs 9000 / 10000", (name) => { expect(find(`Susu ${name}`).prices.cup.hot.sale).toBe(9000); expect(find(`Susu ${name}`).prices.cup.cold.sale).toBe(10000); });
  it.each(["Kopi", "Milo"])("%s costs 10000 / 11000", (name) => { expect(find(`Susu ${name}`).prices.cup.hot.sale).toBe(10000); expect(find(`Susu ${name}`).prices.cup.cold.sale).toBe(11000); });
  it("Chocolatos costs 11000 / 12000", () => { expect(find("Susu Chocolatos").prices.cup.hot.sale).toBe(11000); expect(find("Susu Chocolatos").prices.cup.cold.sale).toBe(12000); });
  it.each([["Susu Madu", 10000], ["Susu Gula Aren", 10000], ["Susu Jahe", 10000], ["Susu Madu Jahe", 12000], ["Susu Gula Aren Jahe", 12000], ["Susu Madu Telur (Ayam)", 14000], ["Susu Madu Telur (Bebek)", 14000], ["Susu Jahe Telur (Ayam)", 14000], ["Susu Jahe Telur (Bebek)", 14000], ["Susu Telur Madu Jahe (STMJ Ayam)", 16000], ["Susu Telur Madu Jahe (STMJ Bebek)", 17000]] as [string, number][])("Mix %s costs %i", (name, price) => { expect(find(name).prices.cup.hot.sale).toBe(price); expect(find(name).prices.cup.cold.sale).toBe(price); });
  it("500ml costs 11000 hot / 12000 cold for every menu", () => { menu.forEach((p) => { expect(p.prices.half.hot.sale).toBe(11000); expect(p.prices.half.cold.sale).toBe(12000); }); });
  it("1000ml costs 21000 hot / 22000 cold for every menu", () => { menu.forEach((p) => { expect(p.prices.liter.hot.sale).toBe(21000); expect(p.prices.liter.cold.sale).toBe(22000); }); });
  it("Regular 14 oz stays 400ml even with a legacy setting", () => { expect(volume("cup", 250)).toBe(400); expect(initialState(false).cupMl).toBe(400); expect(volume("half", 400)).toBe(500); expect(volume("liter", 400)).toBe(1000); });
  it("STMJ is hot-only with one size", () => { const line = makeLine(find("Susu Madu"), "liter", "cold", 1, 250); expect(line).toMatchObject({ size: "cup", serving: "hot", ml: 400, sale: 10000 }); });
});
describe("Record corrections", () => {
  const sell = () => checkoutState(initialState(false), [makeLine(find("Susu Ori Tawar"), "cup", "hot", 5, 400)], "tunai");
  it("Deleting a sale restores stock and removes revenue and HPP", () => {
    const s = sell(); const sale = s.sales[0]; if (!sale) throw new Error("Missing sale");
    const next = reviseSaleState(s, sale.id);
    expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(25);
    expect(next.inventory.find((x) => x.id === "cup")?.qty).toBe(100);
    expect(summary(next)).toMatchObject({ revenue: 0, cost: 0, profit: 0 });
  });
  it("Editing a sale replaces consumption and accounting, not adds it twice", () => {
    const s = sell(); const sale = s.sales[0]; const line = sale?.items[0]; if (!sale || !line) throw new Error("Missing sale");
    const next = reviseSaleState(s, sale.id, [{ ...line, qty: 2, sale: 9000, cost: 4000 }], "qris");
    expect(next.sales).toHaveLength(1); expect(next.sales[0]?.ts).toBe(sale.ts);
    expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(24.2);
    expect(summary(next)).toMatchObject({ revenue: 18000, cost: 8000, profit: 10000, qris: 18000, cash: 0 });
  });
  it("Insufficient stock rejects a correction without restoring the original", () => {
    const s = sell(); const sale = s.sales[0]; const line = sale?.items[0]; if (!sale || !line) throw new Error("Missing sale");
    expect(() => reviseSaleState(s, sale.id, [{ ...line, qty: 100 }])).toThrow();
    expect(s.inventory.find((x) => x.id === "milk")?.qty).toBe(23); expect(s.sales[0]?.total).toBe(40000);
  });
  it("Deleting multi-item waste restores milk and eggs and removes loss", () => {
    const s = wasteState(initialState(false), { milk: 0.5, ayam: 2 }, ""); const w = s.waste[0]; if (!w) throw new Error("Missing waste");
    const next = reviseWasteState(s, w.id);
    expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(25); expect(next.inventory.find((x) => x.id === "ayam")?.qty).toBe(30); expect(summary(next).waste).toBe(0);
  });
  it("Editing waste restores old quantities before deducting new quantities", () => {
    const s = wasteState(initialState(false), { milk: 0.5, ayam: 2 }, ""); const w = s.waste[0]; if (!w) throw new Error("Missing waste");
    const next = reviseWasteState(s, w.id, { milk: 1 }, "Updated");
    expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(24); expect(next.inventory.find((x) => x.id === "ayam")?.qty).toBe(30); expect(summary(next).waste).toBe(9000); expect(next.waste[0]?.ts).toBe(w.ts);
  });
  it("Restoration converts captured units after inventory unit changes", () => {
    const s = sell(); const sale = s.sales[0]; if (!sale) throw new Error("Missing sale");
    s.inventory = s.inventory.map((x) => x.id === "milk" ? { ...x, unit: "Ml", qty: x.qty * 1000 } : x);
    expect(reviseSaleState(s, sale.id).inventory.find((x) => x.id === "milk")?.qty).toBe(25000);
  });
  it("Deleting demo history never adds stock", () => { const s = initialState(true); const sale = s.sales[0]; if (!sale) throw new Error("Missing demo"); expect(reviseSaleState(s, sale.id).inventory).toEqual(s.inventory); });
  it("Today's chart buckets real sales hourly and other filters by month", () => {
    const s = sell(); const sale = s.sales[0]; if (!sale) throw new Error("Missing sale");
    const now = new Date(2026, 10, 14, 12); const sales = [{ ...sale, ts: new Date(2026, 10, 14, 9).getTime(), total: 9000 }, { ...sale, ts: new Date(2026, 0, 1).getTime(), total: 8000 }];
    expect(revenueTrend(sales, "day", 2026, now)[9]?.revenue).toBe(9000);
    expect(revenueTrend(sales, "day", 2026, now).reduce((a, x) => a + x.revenue, 0)).toBe(9000);
    expect(revenueTrend(sales, "month", 2026, now)[0]?.revenue).toBe(8000);
    expect(revenueTrend(sales, "all", 2026, now)[10]?.revenue).toBe(9000);
  });
});
describe("SugarApp inventory and accounting", () => {
  it("Five 400ml cups deduct 2 liters and five cups", () => { const s = initialState(false); const next = checkoutState(s, [makeLine(find("Susu Ori Tawar"), "cup", "hot", 5, 400)], "tunai"); expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(23); expect(next.inventory.find((x) => x.id === "cup")?.qty).toBe(95); expect(next.sales[0]?.total).toBe(40000); expect(next.sales[0]?.cost).toBe(15000); });
  it("Price and HPP are historical snapshots", () => { const s = checkoutState(initialState(false), [makeLine(find("Susu Ori Tawar"), "cup", "hot", 1, 250)], "qris"); const product = s.menu.find((x) => x.name === "Susu Ori Tawar"); if (product) product.prices.cup.hot = { sale: 20000, cost: 6000 }; expect(s.sales[0]?.total).toBe(8000); expect(s.sales[0]?.cost).toBe(3000); });
  it("Multi-item waste deducts milk and eggs and records package HPP", () => { const next = wasteState(initialState(false), { milk: 0.5, ayam: 2 }, "Tumpah / Pecah"); expect(next.inventory.find((x) => x.id === "milk")?.qty).toBe(24.5); expect(next.inventory.find((x) => x.id === "ayam")?.qty).toBe(28); expect(next.waste[0]?.cost).toBe(9500); });
  it("Insufficient stock cannot create a sale or waste", () => { const s = initialState(false); expect(() => checkoutState(s, [makeLine(find("Susu Ori Tawar"), "liter", "hot", 26, 250)], "tunai")).toThrow(); expect(() => wasteState(s, { milk: 26 }, "")).toThrow(); expect(s.sales).toHaveLength(0); expect(s.inventory.find((x) => x.id === "milk")?.qty).toBe(25); });
  it("Net profit subtracts sold HPP, operating expenses and waste", () => { let s = checkoutState(initialState(false), [makeLine(find("Susu Ori Tawar"), "cup", "hot", 5, 250)], "tunai"); s = checkoutState(s, [makeLine(find("Susu Ori Tawar"), "half", "cold", 1, 250)], "qris"); s.expenses = [{ id: "exp", ts: Date.now(), category: "Gas", note: "", amount: 2000 }]; s = wasteState(s, { milk: 0.5 }, ""); expect(summary(s)).toMatchObject({ revenue: 52000, cost: 20550, expense: 2000, waste: 4500, profit: 24950, cash: 40000, qris: 12000 }); });
});