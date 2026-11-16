import { useSyncExternalStore } from "react";
import { flushSync, recordEvents, type SyncEvent } from "./sugarapp-sync";

export type Size = "cup" | "half" | "liter";
export type Serving = "hot" | "cold";
export type Language = "id" | "en";
export type Method = "tunai" | "qris";
export type Sweetness = "Tawar" | "Manis" | "Summer";
export interface Price { sale: number; cost: number }
export interface Menu { id: string; name: string; category: "fresh" | "mix"; prices: Record<Size, Record<Serving, Price>>; recipe: Record<string, number> }
export interface Inventory { id: string; name: string; group: "raw" | "flavor" | "supply"; unit: string; pack: string; capacity: number; purchase: number; qty: number }
export interface OrderLine { key: string; pid: string; name: string; size: Size; ml: number; serving: Serving; qty: number; sale: number; cost: number; recipe: Record<string, number>; sweetness?: Sweetness }
export interface Sale { id: string; ts: number; method: Method; items: OrderLine[]; total: number; cost: number; demo?: boolean; stockUsed?: { id: string; qty: number; unit: string }[] }
export interface Expense { id: string; ts: number; category: string; note: string; amount: number; restock?: { id: string; qty: number; unit: string; previousUnitCost: number; unitCost: number } }
export interface Waste { id: string; ts: number; items: { id: string; name: string; qty: number; unit: string; cost: number }[]; note: string; cost: number }
export interface SugarState { version: 2; cupMl: number; menu: Menu[]; inventory: Inventory[]; sales: Sale[]; expenses: Expense[]; waste: Waste[]; theme: "light" | "dark"; language: Language; qris: string; logo?: string; webhookUrl?: string; syncQueue?: SyncEvent[]; syncStatus?: "sending" | "dispatched" | "failed"; lastDispatch?: number }
export const STORAGE_KEY = "sugarapp-v2";
export const sizes: Size[] = ["cup", "half", "liter"];
export const servings: Serving[] = ["hot", "cold"];
export const rp = (v: number) => "Rp " + Math.round(v).toLocaleString("id-ID");
export const id = () => crypto.randomUUID();
export const volume = (size: Size, _cupMl = 400) => size === "cup" ? 400 : size === "half" ? 500 : 1000;
export const flavorNames = ["Cokelat", "Stroberi", "Moka", "Melon", "Anggur", "Vanila", "Durian", "Leci", "Taro", "Matcha", "Bluberry", "Mangga", "Banana", "Bubble Gum", "Apel", "Karamel", "Cappucino", "Butterscotch", "Green Tea", "Milo", "Chocolatos"];
const slug = (v: string) => v.toLowerCase().replaceAll(" ", "-");
export function menuDefaults(): Menu[] {
  const build = (name: string, category: Menu["category"], hot: number, cold: number, recipe: Record<string, number>, cost: number): Menu => ({
    id: slug(name), name, category, recipe,
    prices: { cup: { hot: { sale: hot, cost }, cold: { sale: cold, cost: cost + 300 } }, half: { hot: { sale: 11000, cost: cost + 2250 }, cold: { sale: 12000, cost: cost + 2550 } }, liter: { hot: { sale: 21000, cost: cost + 6750 }, cold: { sale: 22000, cost: cost + 7050 } } },
  });
  const result = ["Tawar", "Manis", "Summer"].map((n) => build(`Susu Ori ${n}`, "fresh", 8000, 9000, n === "Tawar" ? {} : { gula: 15 }, 3000));
  for (const name of flavorNames) {
    const price = name === "Chocolatos" ? 11000 : name === "Milo" ? 10000 : 9000;
    result.push(build(`Susu ${name}`, "fresh", price, price + 1000, { [slug(name)]: 15, gula: 10 }, 3800));
  }
  result.push(build("Susu Kopi", "fresh", 10000, 11000, { kopi: 15, gula: 10 }, 4000));
  const mixes: [string, number, Record<string, number>, number][] = [
    ["Susu Madu", 10000, { madu: 20 }, 4600], ["Susu Gula Aren", 10000, { aren: 20 }, 3900], ["Susu Jahe", 10000, { jahe: 15 }, 4200],
    ["Susu Madu Jahe", 12000, { madu: 20, jahe: 15 }, 5400], ["Susu Gula Aren Jahe", 12000, { aren: 20, jahe: 15 }, 4700],
    ["Susu Madu Telur (Ayam)", 14000, { madu: 20, ayam: 1 }, 7100], ["Susu Madu Telur (Bebek)", 14000, { madu: 20, bebek: 1 }, 7600],
    ["Susu Jahe Telur (Ayam)", 14000, { jahe: 15, ayam: 1 }, 6700], ["Susu Jahe Telur (Bebek)", 14000, { jahe: 15, bebek: 1 }, 7200],
    ["Susu Telur Madu Jahe (STMJ Ayam)", 16000, { madu: 20, jahe: 15, ayam: 1 }, 7900], ["Susu Telur Madu Jahe (STMJ Bebek)", 17000, { madu: 20, jahe: 15, bebek: 1 }, 8400],
  ];
  mixes.forEach(([name, price, recipe, cost]) => result.push(build(name, "mix", price, price, recipe, cost)));
  return result;
}
export function inventoryDefaults(): Inventory[] {
  const item = (id: string, name: string, unit: string, pack: string, capacity: number, purchase: number, qty: number, group: Inventory["group"] = "raw"): Inventory => ({ id, name, unit, pack, capacity, purchase, qty, group });
  return [item("milk", "Susu Segar", "Liter", "Jeriken", 5, 45000, 25), item("gula", "Gula Putih", "Gram", "Pak", 1000, 18000, 2000), item("aren", "Gula Aren", "Ml", "Botol", 1000, 35000, 1500), item("jahe", "Jahe", "Gram", "Pak", 1000, 40000, 1500), item("madu", "Madu", "Ml", "Botol", 500, 40000, 1000), item("kopi", "Kopi", "Gram", "Pak", 250, 25000, 500), item("ayam", "Telur Ayam", "Butir", "Tray", 30, 75000, 30), item("bebek", "Telur Bebek", "Butir", "Tray", 30, 90000, 30),
    ...flavorNames.map((name) => item(slug(name), name, "Gram", "Bubuk / Pak", 500, 35000, 1000, "flavor")),
    item("straw", "Sedotan", "Pcs", "Pak", 100, 10000, 200, "supply"), item("cup", "Cup Reguler", "Pcs", "Pak", 50, 30000, 100, "supply"), item("half", "Cup 500 ml", "Pcs", "Pak", 50, 40000, 100, "supply"), item("liter", "Kemasan 1 Liter", "Pcs", "Pak", 25, 30000, 50, "supply")];
}
export function initialState(demo = true): SugarState {
  const menu = menuDefaults();
  const sales: Sale[] = [];
  if (demo) for (let d = 29; d >= 1; d--) {
    const product = menu[d % menu.length];
    if (!product) continue;
    const date = new Date(); date.setDate(date.getDate() - d); date.setHours(16, 0, 0, 0);
    const line = makeLine(product, "cup", product.category === "mix" ? "hot" : "cold", 12 + (d * 7) % 24, 400);
    sales.push({ id: `demo-${d}`, ts: date.getTime(), method: d % 2 ? "tunai" : "qris", items: [line], total: line.sale * line.qty, cost: line.cost * line.qty, demo: true });
  }
  return { version: 2, cupMl: 400, menu, inventory: inventoryDefaults(), sales, expenses: [], waste: [], theme: "light", language: "id", qris: "", logo: "" };
}
export function freshMenu(menu: Menu[]) { return menu.filter(p => p.category === "fresh" && !/^Susu Ori (Manis|Summer)$/.test(p.name)).map(p => p.name === "Susu Ori Tawar" ? { ...p, name: "Susu Ori" } : p); }
export function makeLine(product: Menu, size: Size, serving: Serving, qty: number, cupMl: number, sweetness?: Sweetness): OrderLine {
  if (product.category === "mix") { size = "cup"; serving = "hot"; }
  const price = product.prices[size][serving];
  const recipe = { ...product.recipe };
  if (product.category === "fresh" && sweetness === "Tawar") delete recipe["gula"];
  return { key: `${product.id}-${size}-${serving}-${cupMl}-${sweetness ?? ""}`, pid: product.id, name: product.name, size, serving, ml: volume(size, cupMl), qty, sale: price.sale, cost: price.cost, recipe, ...(sweetness ? { sweetness } : {}) };
}
const baseFactor = (unit: string) => unit.toLowerCase() === "kg" ? 1000 : unit.toLowerCase() === "liter" ? 1000 : 1;
export function requirements(lines: OrderLine[], inventory: Inventory[]): Record<string, number> {
  const required: Record<string, number> = {};
  const add = (stockId: string, base: number) => {
    const item = inventory.find((x) => x.id === stockId);
    if (item) required[stockId] = (required[stockId] || 0) + base / baseFactor(item.unit);
  };
  for (const line of lines) {
    add("milk", line.ml * line.qty); add(line.size, line.qty); add("straw", line.qty);
    for (const [stockId, qty] of Object.entries(line.recipe)) {
      add(stockId, qty * (stockId === "ayam" || stockId === "bebek" ? 1 : line.ml / 250) * line.qty);
    }
  }
  return required;
}
export function checkoutState(s: SugarState, lines: OrderLine[], method: Method): SugarState {
  if (!lines.length || lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) throw new Error("Pesanan tidak valid / Invalid order");
  const needed = requirements(lines, s.inventory);
  for (const [stockId, amount] of Object.entries(needed)) {
    const stock = s.inventory.find((x) => x.id === stockId);
    if (stock && amount > stock.qty + 0.000001) throw new Error(`Stok tidak cukup / Insufficient stock: ${stock.name}`);
  }
  return { ...s, inventory: s.inventory.map((x) => ({ ...x, qty: +(x.qty - (needed[x.id] || 0)).toFixed(5) })), sales: [...s.sales, { id: id(), ts: Date.now(), method, items: structuredClone(lines), total: lines.reduce((a, l) => a + l.qty * l.sale, 0), cost: lines.reduce((a, l) => a + l.qty * l.cost, 0), stockUsed: s.inventory.filter((x) => needed[x.id]).map((x) => ({ id: x.id, qty: needed[x.id] ?? 0, unit: x.unit })) }] };
}
export function wasteState(s: SugarState, quantities: Record<string, number>, note: string): SugarState {
  if (Object.values(quantities).some((qty) => !Number.isFinite(qty) || qty < 0)) throw new Error("Jumlah tidak valid / Invalid quantity");
  const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
  if (!entries.length) throw new Error("Pilih barang / Select an item");
  const items = entries.map(([stockId, qty]) => {
    const stock = s.inventory.find((x) => x.id === stockId);
    if (!stock || !Number.isFinite(qty) || qty > stock.qty) throw new Error("Jumlah melebihi stok / Quantity exceeds stock");
    return { id: stockId, name: stock.name, qty, unit: stock.unit, cost: qty * stock.purchase / stock.capacity };
  });
  return { ...s, inventory: s.inventory.map((x) => ({ ...x, qty: +(x.qty - (quantities[x.id] || 0)).toFixed(5) })), waste: [...s.waste, { id: id(), ts: Date.now(), items, note, cost: items.reduce((a, x) => a + x.cost, 0) }] };
}
export function summary(s: SugarState, from = 0, to = Infinity) {
  const sales = s.sales.filter((x) => x.ts >= from && x.ts <= to);
  const revenue = sales.reduce((a, x) => a + x.total, 0);
  const cost = sales.reduce((a, x) => a + x.cost, 0);
  const expense = s.expenses.filter((x) => x.ts >= from && x.ts <= to).reduce((a, x) => a + x.amount, 0);
  const waste = s.waste.filter((x) => x.ts >= from && x.ts <= to).reduce((a, x) => a + x.cost, 0);
  return { revenue, cost, expense, waste, profit: revenue - cost - expense - waste, count: sales.length, cups: sales.reduce((a, x) => a + x.items.reduce((n, l) => n + l.qty, 0), 0), cash: sales.filter((x) => x.method === "tunai").reduce((a, x) => a + x.total, 0), qris: sales.filter((x) => x.method === "qris").reduce((a, x) => a + x.total, 0) };
}
function restoreStock(s: SugarState, items: { id: string; qty: number; unit: string }[]): SugarState {
  if (items.some((i) => !s.inventory.some((x) => x.id === i.id))) throw new Error("Barang inventaris tidak ditemukan / Inventory item missing");
  return { ...s, inventory: s.inventory.map((x) => ({ ...x, qty: +(x.qty + items.filter((i) => i.id === x.id).reduce((a, i) => a + i.qty * baseFactor(i.unit) / baseFactor(x.unit), 0)).toFixed(5) })) };
}
export function reviseWasteState(s: SugarState, wasteId: string, quantities?: Record<string, number>, note = ""): SugarState {
  const old = s.waste.find((x) => x.id === wasteId); if (!old) throw new Error("Catatan tidak ditemukan / Record missing");
  const restored = restoreStock({ ...s, waste: s.waste.filter((x) => x.id !== wasteId) }, old.items);
  if (!quantities) return restored;
  const next = wasteState(restored, quantities, note);
  const added = next.waste.at(-1); if (!added) throw new Error("Invalid waste");
  added.id = old.id; added.ts = old.ts;
  return next;
}
export function reviseSaleState(s: SugarState, saleId: string, lines?: OrderLine[], method?: Method): SugarState {
  const old = s.sales.find((x) => x.id === saleId); if (!old) throw new Error("Transaksi tidak ditemukan / Transaction missing");
  const used = old.demo ? [] : old.stockUsed ?? Object.entries(requirements(old.items, s.inventory)).map(([id, qty]) => ({ id, qty, unit: s.inventory.find((x) => x.id === id)?.unit ?? "" }));
  const restored = restoreStock({ ...s, sales: s.sales.filter((x) => x.id !== saleId) }, used);
  if (!lines) return restored;
  if (lines.some((l) => !Number.isFinite(l.sale) || !Number.isFinite(l.cost) || l.sale < 0 || l.cost < 0)) throw new Error("Harga tidak valid / Invalid price");
  const next = checkoutState(restored, lines, method ?? old.method);
  const added = next.sales.at(-1); if (!added) throw new Error("Invalid sale");
  added.id = old.id; added.ts = old.ts;
  return next;
}
let state: SugarState | undefined;
const listeners = new Set<() => void>();
function load(): SugarState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    state = saved?.version === 2 && Array.isArray(saved.menu) && Array.isArray(saved.inventory) ? { ...saved, cupMl: 400, logo: saved.logo ?? "" } : initialState();
  } catch { state = initialState(); }
  return state ?? initialState();
}
function save(next: SugarState) {
  const previous = load();
  const events = recordEvents(previous, next);
  const queued = { ...next, syncQueue: [...(next.syncQueue ?? []), ...events] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queued));
  state = queued;
  listeners.forEach((listener) => listener());
  if (events.length || next.webhookUrl !== previous.webhookUrl) queueMicrotask(() => { void flushSync(sugar).catch(() => undefined); });
}
export function useSugar() { return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, load, load); }
export const sugar = {
  get: load,
  update: (fn: (s: SugarState) => SugarState) => save(fn(structuredClone(load()))),
  checkout: (lines: OrderLine[], method: Method) => save(checkoutState(load(), lines, method)),
  waste: (qty: Record<string, number>, note: string) => save(wasteState(load(), qty, note)),
  reviseWaste: (id: string, qty?: Record<string, number>, note?: string) => save(reviseWasteState(load(), id, qty, note)),
  reviseSale: (id: string, lines?: OrderLine[], method?: Method) => save(reviseSaleState(load(), id, lines, method)),
  expense: (value: Expense) => save(expenseState(load(), value)),
  removeExpense: (id: string) => save(expenseState(load(), undefined, id)),
  reset: (demo: boolean) => save({ ...initialState(demo), theme: load().theme, language: load().language, qris: load().qris, logo: load().logo ?? "" }),
};
export function useWords() { const { language } = useSugar(); return (indonesian: string, english: string) => language === "id" ? indonesian : english; }

export function expenseState(s: SugarState, value?: Expense, expenseId = value?.id): SugarState {
  const old = s.expenses.find(x => x.id === expenseId);
  let inventory = s.inventory.map(x => ({ ...x }));
  if (old?.restock) {
    const item = inventory.find(x => x.id === old.restock?.id);
    if (!item) throw new Error("Barang inventaris tidak ditemukan");
    const qty = old.restock.qty * baseFactor(old.restock.unit) / baseFactor(item.unit);
    if (qty > item.qty + 0.000001) throw new Error("Stok pembelian sudah terpakai; koreksi stok terlebih dahulu");
    item.qty = +(item.qty - qty).toFixed(5);
    const cost = old.restock.unitCost * baseFactor(item.unit) / baseFactor(old.restock.unit);
    if (Math.abs(item.purchase / item.capacity - cost) < 0.000001) item.purchase = old.restock.previousUnitCost * baseFactor(item.unit) / baseFactor(old.restock.unit) * item.capacity;
  }
  let expense = value ? structuredClone(value) : undefined;
  if (expense) {
    if (!Number.isFinite(expense.amount) || expense.amount <= 0) throw new Error("Nominal tidak valid");
    if (old) expense.ts = old.ts;
    if (expense.restock) {
      const item = inventory.find(x => x.id === expense?.restock?.id); const input = expense.restock;
      if (!item || !Number.isFinite(input.qty) || input.qty <= 0) throw new Error("Jumlah stok masuk tidak valid");
      const qty = input.qty * baseFactor(input.unit) / baseFactor(item.unit);
      expense.restock = { id: item.id, qty, unit: item.unit, previousUnitCost: item.purchase / item.capacity, unitCost: expense.amount / qty };
      item.qty = +(item.qty + qty).toFixed(5); item.purchase = expense.amount / qty * item.capacity;
    }
  }
  return { ...s, inventory, expenses: [...s.expenses.filter(x => x.id !== expenseId), ...(expense ? [expense] : [])] };
}